const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenFactory", function () {
  let factory, template, usdt, owner, feeReceiver, user, attacker;
  const FEE_MATIC = ethers.parseEther("1");     // 1 MATIC
  const FEE_USDT = 5_000_000n;                   // 5 USDT (6 decimals)

  beforeEach(async function () {
    [owner, feeReceiver, user, attacker] = await ethers.getSigners();

    // دیپلوی توکن USDT جعلی (mock) با 6 رقم اعشار برای تست
    const MockUsdt = await ethers.getContractFactory("MockERC20");
    usdt = await MockUsdt.deploy("Tether USD", "USDT", 6);
    await usdt.waitForDeployment();
    await usdt.mint(user.address, 1_000_000_000n); // 1000 USDT به کاربر تست

    // دیپلوی implementation قالب
    const Template = await ethers.getContractFactory("ERC20Template");
    template = await Template.deploy();
    await template.waitForDeployment();

    // دیپلوی فکتوری
    const Factory = await ethers.getContractFactory("TokenFactory");
    factory = await Factory.deploy(
      await template.getAddress(),
      await usdt.getAddress(),
      feeReceiver.address,
      FEE_MATIC,
      FEE_USDT
    );
    await factory.waitForDeployment();
  });

  describe("امنیت قالب (Template)", function () {
    it("نباید بشود initialize را مستقیم روی implementation صدا زد", async function () {
      await expect(
        template.initialize("Evil", "EVL", 1000, attacker.address)
      ).to.be.revertedWithCustomError(template, "InvalidInitialization");
    });
  });

  describe("ساخت توکن با MATIC", function () {
    it("باید توکن را بسازد و کمیسیون را منتقل کند", async function () {
      const supply = ethers.parseUnits("1000", 18);
      const before = await ethers.provider.getBalance(feeReceiver.address);

      const tx = await factory.connect(user).createTokenWithMatic(
        "MyToken", "MTK", supply, FEE_MATIC, { value: FEE_MATIC }
      );
      const receipt = await tx.wait();

      const after = await ethers.provider.getBalance(feeReceiver.address);
      expect(after - before).to.equal(FEE_MATIC);

      const event = receipt.logs
        .map((l) => { try { return factory.interface.parseLog(l); } catch { return null; } })
        .find((e) => e && e.name === "TokenCreated");
      expect(event).to.not.be.undefined;

      const token = await ethers.getContractAt("ERC20Template", event.args.tokenAddress);
      expect(await token.balanceOf(user.address)).to.equal(supply);
      expect(await token.name()).to.equal("MyToken");
      expect(await token.symbol()).to.equal("MTK");
    });

    it("باید اگر کمیسیون کافی نباشد رد شود", async function () {
      const supply = ethers.parseUnits("1000", 18);
      await expect(
        factory.connect(user).createTokenWithMatic(
          "MyToken", "MTK", supply, FEE_MATIC, { value: FEE_MATIC - 1n }
        )
      ).to.be.revertedWith("Commission (MATIC) not enough");
    });

    it("باید مابقی پول اضافه‌ارسالی را برگرداند", async function () {
      const supply = ethers.parseUnits("1000", 18);
      const extra = ethers.parseEther("0.5");
      const balBefore = await ethers.provider.getBalance(user.address);

      const tx = await factory.connect(user).createTokenWithMatic(
        "MyToken", "MTK", supply, FEE_MATIC + extra, { value: FEE_MATIC + extra }
      );
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balAfter = await ethers.provider.getBalance(user.address);
      // کاربر باید فقط FEE_MATIC + گس پرداخت کرده باشد، نه FEE_MATIC + extra
      expect(balBefore - balAfter - gasUsed).to.equal(FEE_MATIC);
    });

    it("باید اگر کمیسیون بعد از ارسال تراکنش توسط ادمین افزایش یابد، با maxFee کاربر محافظت شود", async function () {
      const supply = ethers.parseUnits("1000", 18);
      // ادمین کمیسیون را افزایش می‌دهد
      await factory.connect(owner).setFees(FEE_MATIC * 2n, FEE_USDT);

      // کاربر با maxFee قدیمی تلاش می‌کند -> باید رد شود
      await expect(
        factory.connect(user).createTokenWithMatic(
          "MyToken", "MTK", supply, FEE_MATIC, { value: FEE_MATIC }
        )
      ).to.be.revertedWith("Fee increased beyond maxFee, aborting");
    });

    it("باید وقتی قرارداد pause شده رد شود", async function () {
      await factory.connect(owner).pause();
      const supply = ethers.parseUnits("1000", 18);
      await expect(
        factory.connect(user).createTokenWithMatic(
          "MyToken", "MTK", supply, FEE_MATIC, { value: FEE_MATIC }
        )
      ).to.be.revertedWithCustomError(factory, "EnforcedPause");
    });
  });

  describe("ساخت توکن با USDT", function () {
    it("باید توکن را بسازد و کمیسیون USDT را منتقل کند", async function () {
      const supply = ethers.parseUnits("500", 18);
      await usdt.connect(user).approve(await factory.getAddress(), FEE_USDT);

      const before = await usdt.balanceOf(feeReceiver.address);
      await factory.connect(user).createTokenWithUsdt("USDToken", "UTK", supply, FEE_USDT);
      const after = await usdt.balanceOf(feeReceiver.address);

      expect(after - before).to.equal(FEE_USDT);
    });

    it("باید بدون approve کافی رد شود", async function () {
      const supply = ethers.parseUnits("500", 18);
      await expect(
        factory.connect(user).createTokenWithUsdt("USDToken", "UTK", supply, FEE_USDT)
      ).to.be.reverted;
    });
  });

  describe("اعتبارسنجی ورودی‌ها", function () {
    it("باید نام خیلی طولانی را رد کند", async function () {
      const longName = "a".repeat(51);
      await expect(
        factory.connect(user).createTokenWithMatic(
          longName, "MTK", ethers.parseUnits("1", 18), FEE_MATIC, { value: FEE_MATIC }
        )
      ).to.be.revertedWith("Invalid name length");
    });

    it("باید نماد خیلی طولانی را رد کند", async function () {
      await expect(
        factory.connect(user).createTokenWithMatic(
          "Name", "TOOLONGSYMBOL", ethers.parseUnits("1", 18), FEE_MATIC, { value: FEE_MATIC }
        )
      ).to.be.revertedWith("Invalid symbol length");
    });

    it("باید عرضه صفر را رد کند", async function () {
      await expect(
        factory.connect(user).createTokenWithMatic(
          "Name", "SYM", 0, FEE_MATIC, { value: FEE_MATIC }
        )
      ).to.be.revertedWith("Supply must be > 0");
    });
  });

  describe("کنترل دسترسی (Access Control)", function () {
    it("فقط owner باید بتواند کمیسیون را تغییر دهد", async function () {
      await expect(
        factory.connect(attacker).setFees(1, 1)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });

    it("فقط owner باید بتواند feeReceiver را تغییر دهد", async function () {
      await expect(
        factory.connect(attacker).setFeeReceiver(attacker.address)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });

    it("انتقال مالکیت باید دو مرحله‌ای باشد (Ownable2Step)", async function () {
      await factory.connect(owner).transferOwnership(attacker.address);
      // هنوز owner قبلی است چون attacker باید accept کند
      expect(await factory.owner()).to.equal(owner.address);
      await factory.connect(attacker).acceptOwnership();
      expect(await factory.owner()).to.equal(attacker.address);
    });

    it("فقط owner باید بتواند قرارداد را pause/unpause کند", async function () {
      await expect(factory.connect(attacker).pause())
        .to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });

  describe("ارسال مستقیم دارایی", function () {
    it("باید ارسال مستقیم MATIC بدون فراخوانی تابع را رد کند", async function () {
      await expect(
        user.sendTransaction({ to: await factory.getAddress(), value: ethers.parseEther("1") })
      ).to.be.revertedWith("Direct payments not accepted, use createTokenWithMatic");
    });

    it("owner باید بتواند توکن گیرکرده به‌اشتباه را بازیابی کند", async function () {
      // کاربر به‌اشتباه USDT مستقیم به قرارداد فکتوری می‌فرستد
      await usdt.connect(user).transfer(await factory.getAddress(), 1000);
      await factory.connect(owner).rescueERC20(await usdt.getAddress(), feeReceiver.address, 1000);
      expect(await usdt.balanceOf(feeReceiver.address)).to.equal(1000);
    });
  });

  describe("Reentrancy", function () {
    it("باید تلاش reentrancy از طریق feeReceiver مخرب را رد کند", async function () {
      const Malicious = await ethers.getContractFactory("MaliciousFeeReceiver");
      const malicious = await Malicious.deploy(await factory.getAddress());
      await malicious.waitForDeployment();

      await factory.connect(owner).setFeeReceiver(await malicious.getAddress());

      const supply = ethers.parseUnits("1000", 18);
      // تراکنش باید یا موفق شود بدون reentrancy، یا کامل fail شود؛ در هر دو حالت state نباید corrupt شود
      await expect(
        factory.connect(user).createTokenWithMatic(
          "MyToken", "MTK", supply, FEE_MATIC, { value: FEE_MATIC }
        )
      ).to.be.reverted; // چون MaliciousFeeReceiver سعی می‌کند دوباره وارد شود و توسط nonReentrant رد می‌شود
    });
  });
});
