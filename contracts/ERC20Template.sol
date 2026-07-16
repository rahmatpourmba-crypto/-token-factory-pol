// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title ERC20Template
/// @notice قالب پایه توکن که برای هر کاربر با الگوی Clone (EIP-1167) کپی سبک می‌شود.
/// @dev امنیت: این قرارداد هرگز نباید مستقیم استفاده شود، فقط باید کلون شود.
///      _disableInitializers() در constructor جلوی این را می‌گیرد که کسی مستقیم
///      روی خودِ implementation، initialize() را صدا بزند و آن را تصاحب کند.
contract ERC20Template is Initializable, ERC20Upgradeable {

    /// @dev غیرفعال کردن initializer روی قرارداد implementation (نه کلون‌ها)
    constructor() {
        _disableInitializers();
    }

    /// @notice این تابع به جای constructor استفاده می‌شود چون قرارداد کلون می‌شود
    /// @param name_ نام توکن
    /// @param symbol_ نماد توکن
    /// @param totalSupply_ کل عرضه (باید از قبل در واحد ریز (wei-like) با احتساب decimals ضرب شده باشد)
    /// @param owner_ آدرس کیف پول کاربری که توکن باید به آن مینت شود
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address owner_
    ) external initializer {
        require(owner_ != address(0), "Owner cannot be zero address");
        require(totalSupply_ > 0, "Supply must be > 0");
        __ERC20_init(name_, symbol_);
        _mint(owner_, totalSupply_);
    }
}
