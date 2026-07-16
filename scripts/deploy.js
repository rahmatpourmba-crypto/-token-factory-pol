// scripts/deploy.js
const { ethers } = require("hardhat");

// آدرس رسمی USDT روی Polygon Mainnet
const USDT_MAINNET = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
// برای تست‌نت Amoy باید یک توکن USDT جعلی (mock) خودتان دیپلوی و اینجا جایگزین کنید

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("دیپلوی با آدرس:", deployer.address);

  const FEE_RECEIVER = (process.env.FEE_RECEIVER_ADDRESS || "0x951399D0BE17396C99E5a2c6aDDDfE9d58C8AB14").trim();
  const USDT_ADDRESS = (process.env.USDT_ADDRESS || USDT_MAINNET).trim();
  const FEE_IN_MATIC = ethers.parseEther(process.env.FEE_MATIC || "1"); // مثلا 1 MATIC
  const FEE_IN_USDT = ethers.parseUnits(process.env.FEE_USDT || "5", 6); // مثلا 5 USDT (6 اعشار)

  if (!ethers.isAddress(FEE_RECEIVER)) {
    throw new Error(`FEE_RECEIVER_ADDRESS نامعتبر است: "${FEE_RECEIVER}"`);
  }
  if (!ethers.isAddress(USDT_ADDRESS)) {
    throw new Error(`USDT_ADDRESS نامعتبر است: "${USDT_ADDRESS}"`);
  }

  console.log("۱. دیپلوی قالب ERC20Template...");
  const Template = await ethers.getContractFactory("ERC20Template");
  const template = await Template.deploy();
  await template.waitForDeployment();
  console.log("   آدرس قالب:", await template.getAddress());

  console.log("۲. دیپلوی TokenFactory...");
  const Factory = await ethers.getContractFactory("TokenFactory");
  const factory = await Factory.deploy(
    await template.getAddress(),
    USDT_ADDRESS,
    FEE_RECEIVER,
    FEE_IN_MATIC,
    FEE_IN_USDT
  );
  await factory.waitForDeployment();
  console.log("   آدرس فکتوری:", await factory.getAddress());

  console.log("\n--- خلاصه ---");
  console.log("Template:      ", await template.getAddress());
  console.log("Factory:       ", await factory.getAddress());
  console.log("Fee receiver:  ", FEE_RECEIVER);
  console.log("USDT address:  ", USDT_ADDRESS);
  console.log("Fee (MATIC):   ", ethers.formatEther(FEE_IN_MATIC));
  console.log("Fee (USDT):    ", ethers.formatUnits(FEE_IN_USDT, 6));
  console.log("\nاین بلاک شماره فعلی را در FACTORY_DEPLOY_BLOCK بک‌اند قرار دهید تا backfill درست کار کند.");
  const block = await ethers.provider.getBlockNumber();
  console.log("Deploy block:  ", block);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});