const { ethers } = require("hardhat");

async function main() {
  const FACTORY_ADDRESS = "0x5f9ad349Fc40DeE22f23801238489F17951B0843";
  const [signer] = await ethers.getSigners();
  console.log("در حال ساخت توکن با آدرس:", signer.address);

  const factory = await ethers.getContractAt("TokenFactory", FACTORY_ADDRESS);

  const name = "Test Token";
  const symbol = "TST";
  const totalSupply = ethers.parseUnits("1000000", 18);
  const maxFee = ethers.parseEther("1.05");

  console.log("در حال ارسال تراکنش createTokenWithMatic...");
  const tx = await factory.createTokenWithMatic(name, symbol, totalSupply, maxFee, {
    value: ethers.parseEther("1"),
  });

  console.log("تراکنش ارسال شد:", tx.hash);
  const receipt = await tx.wait();
  console.log("تراکنش تایید شد در بلاک:", receipt.blockNumber);

  const event = receipt.logs
    .map((log) => {
      try {
        return factory.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "TokenCreated");

  if (event) {
    console.log("توکن با موفقیت ساخته شد!");
    console.log("   آدرس توکن:", event.args.tokenAddress);
    console.log("   نام:", event.args.name);
    console.log("   نماد:", event.args.symbol);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});