// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ERC20Template.sol";

/// @title TokenFactory
/// @notice کاربر با پرداخت کمیسیون (به MATIC یا USDT) می‌تواند توکن ERC-20 دلخواه خود
///         را مستقیماً روی Polygon بسازد و به کیف پول خودش دریافت کند.
/// @dev نسخه بازبینی‌شده از نظر امنیتی:
///      - Ownable2Step به‌جای Ownable ساده (جلوگیری از گم‌شدن مالکیت)
///      - Pausable برای توقف اضطراری
///      - محدودیت طول name/symbol برای جلوگیری از gas griefing
///      - پارامتر maxFee برای محافظت کاربر در برابر تغییر ناگهانی کمیسیون (front-running)
///      - تابع rescue برای بازیابی دارایی‌های گیرکرده به‌اشتباه
contract TokenFactory is Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    uint8 public constant MAX_NAME_LENGTH = 50;
    uint8 public constant MAX_SYMBOL_LENGTH = 11;

    /// @notice آدرس قالب اصلی توکن که کلون می‌شود
    address public immutable tokenImplementation;

    /// @notice آدرس کیف پولی که کمیسیون‌ها به آن واریز می‌شود
    address public feeReceiver;

    /// @notice کمیسیون به واحد ریز MATIC (wei) — 18 رقم اعشار
    uint256 public feeInMatic;

    /// @notice کمیسیون به واحد ریز USDT — دقت کنید USDT روی Polygon معمولا 6 رقم اعشار دارد نه 18
    uint256 public feeInUsdt;

    /// @notice آدرس قرارداد USDT روی Polygon
    IERC20 public immutable usdtToken;

    event TokenCreated(
        address indexed creator,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 totalSupply,
        string paymentMethod
    );

    event FeesUpdated(uint256 newFeeMatic, uint256 newFeeUsdt);
    event FeeReceiverUpdated(address newReceiver);
    event AssetRescued(address indexed token, address indexed to, uint256 amount);

    constructor(
        address _tokenImplementation,
        address _usdtToken,
        address _feeReceiver,
        uint256 _feeInMatic,
        uint256 _feeInUsdt
    ) Ownable(msg.sender) {
        require(_tokenImplementation != address(0), "Zero implementation address");
        require(_usdtToken != address(0), "Zero USDT address");
        require(_feeReceiver != address(0), "Zero fee receiver address");

        tokenImplementation = _tokenImplementation;
        usdtToken = IERC20(_usdtToken);
        feeReceiver = _feeReceiver;
        feeInMatic = _feeInMatic;
        feeInUsdt = _feeInUsdt;
    }

    /// @notice ساخت توکن با پرداخت کمیسیون به MATIC
    /// @param name_ نام توکن
    /// @param symbol_ نماد توکن
    /// @param totalSupply_ کل عرضه (با احتساب 18 رقم اعشار خودتان ضرب کنید، مثلا 1000 * 10**18)
    /// @param maxFee حداکثر کمیسیونی که کاربر حاضر است بپردازد (محافظت در برابر تغییر کمیسیون توسط ادمین بعد از ارسال تراکنش)
    function createTokenWithMatic(
        string calldata name_,
        string calldata symbol_,
        uint256 totalSupply_,
        uint256 maxFee
    ) external payable nonReentrant whenNotPaused returns (address tokenAddress) {
        uint256 currentFee = feeInMatic;
        require(currentFee <= maxFee, "Fee increased beyond maxFee, aborting");
        require(msg.value >= currentFee, "Commission (MATIC) not enough");
        _validateNameSymbol(name_, symbol_);
        require(totalSupply_ > 0, "Supply must be > 0");

        tokenAddress = _deployToken(name_, symbol_, totalSupply_, msg.sender);

        // انتقال دقیق مبلغ کمیسیون به کیف پول صاحب سایت (نه بیشتر)
        (bool sent, ) = feeReceiver.call{value: currentFee}("");
        require(sent, "Fee transfer failed");

        // بازگرداندن مابقی (اگر کاربر بیشتر از کمیسیون فرستاده باشد)
        uint256 refund = msg.value - currentFee;
        if (refund > 0) {
            (bool refunded, ) = msg.sender.call{value: refund}("");
            require(refunded, "Refund failed");
        }

        emit TokenCreated(msg.sender, tokenAddress, name_, symbol_, totalSupply_, "MATIC");
    }

    /// @notice ساخت توکن با پرداخت کمیسیون به USDT
    /// @dev کاربر باید قبلا approve کند: usdtToken.approve(factoryAddress, feeInUsdt)
    /// @param maxFee حداکثر کمیسیون USDT که کاربر می‌پذیرد (واحد: ریز USDT، معمولا 6 رقم اعشار)
    function createTokenWithUsdt(
        string calldata name_,
        string calldata symbol_,
        uint256 totalSupply_,
        uint256 maxFee
    ) external nonReentrant whenNotPaused returns (address tokenAddress) {
        uint256 currentFee = feeInUsdt;
        require(currentFee <= maxFee, "Fee increased beyond maxFee, aborting");
        _validateNameSymbol(name_, symbol_);
        require(totalSupply_ > 0, "Supply must be > 0");

        // انتقال کمیسیون USDT از کاربر به کیف پول صاحب سایت
        usdtToken.safeTransferFrom(msg.sender, feeReceiver, currentFee);

        tokenAddress = _deployToken(name_, symbol_, totalSupply_, msg.sender);

        emit TokenCreated(msg.sender, tokenAddress, name_, symbol_, totalSupply_, "USDT");
    }

    /// @notice تعداد رقم اعشار USDT مورد استفاده در این قرارداد را برمی‌گرداند
    ///         تا فرانت‌اند مجبور نباشد آن را هاردکد کند و اشتباه محاسباتی رخ ندهد
    function usdtDecimals() external view returns (uint8) {
        return IERC20Metadata(address(usdtToken)).decimals();
    }

    function _validateNameSymbol(string calldata name_, string calldata symbol_) internal pure {
        require(bytes(name_).length > 0 && bytes(name_).length <= MAX_NAME_LENGTH, "Invalid name length");
        require(bytes(symbol_).length > 0 && bytes(symbol_).length <= MAX_SYMBOL_LENGTH, "Invalid symbol length");
    }

    function _deployToken(
        string calldata name_,
        string calldata symbol_,
        uint256 totalSupply_,
        address recipient
    ) internal returns (address tokenAddress) {
        tokenAddress = Clones.clone(tokenImplementation);
        ERC20Template(tokenAddress).initialize(name_, symbol_, totalSupply_, recipient);
    }

    /// @notice ساخت توکن رایگان و بدون پرداخت کمیسیون — فقط مالک سایت می‌تواند این تابع را صدا بزند
    /// @dev برخلاف createTokenWithMatic/createTokenWithUsdt، اینجا نیازی به ارسال هیچ پرداختی نیست
    /// @param name_ نام توکن
    /// @param symbol_ نماد توکن
    /// @param totalSupply_ کل عرضه (با احتساب 18 رقم اعشار)
    /// @param recipient آدرس کیف پولی که توکن باید به آن مینت شود (می‌تواند خودِ owner یا هرکس دیگری باشد)
    function createTokenFree(
        string calldata name_,
        string calldata symbol_,
        uint256 totalSupply_,
        address recipient
    ) external onlyOwner nonReentrant whenNotPaused returns (address tokenAddress) {
        require(recipient != address(0), "Recipient cannot be zero address");
        _validateNameSymbol(name_, symbol_);
        require(totalSupply_ > 0, "Supply must be > 0");

        tokenAddress = _deployToken(name_, symbol_, totalSupply_, recipient);

        emit TokenCreated(recipient, tokenAddress, name_, symbol_, totalSupply_, "FREE_OWNER");
    }

    // ---------------------------------------------------------------
    // توابع مدیریتی (فقط مالک سایت)
    // ---------------------------------------------------------------

    function setFees(uint256 _feeInMatic, uint256 _feeInUsdt) external onlyOwner {
        feeInMatic = _feeInMatic;
        feeInUsdt = _feeInUsdt;
        emit FeesUpdated(_feeInMatic, _feeInUsdt);
    }

    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "Zero address");
        feeReceiver = _feeReceiver;
        emit FeeReceiverUpdated(_feeReceiver);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice بازیابی توکن‌های ERC20 ارسال‌شده به‌اشتباه به این قرارداد (نه دارایی کاربران، چون
    ///         این قرارداد هرگز توکن کاربران را نگه نمی‌دارد؛ فقط برای رفع اشتباهات ارسال مستقیم)
    function rescueERC20(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Zero address");
        IERC20(token).safeTransfer(to, amount);
        emit AssetRescued(token, to, amount);
    }

    /// @notice بازیابی MATIC ارسال‌شده به‌اشتباه مستقیم به این قرارداد
    function rescueNative(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Zero address");
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Rescue transfer failed");
        emit AssetRescued(address(0), to, amount);
    }

    /// @dev رد کردن هرگونه ارسال مستقیم MATIC بدون فراخوانی تابع مشخص، تا دارایی به‌اشتباه گیر نکند
    receive() external payable {
        revert("Direct payments not accepted, use createTokenWithMatic");
    }
}
