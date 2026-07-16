// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITokenFactory {
    function createTokenWithMatic(
        string calldata name_,
        string calldata symbol_,
        uint256 totalSupply_,
        uint256 maxFee
    ) external payable returns (address);
}

/// @notice قراردادی برای تست حمله reentrancy روی TokenFactory
///         وقتی به‌عنوان feeReceiver تنظیم شود، سعی می‌کند در حین دریافت کمیسیون
///         دوباره وارد createTokenWithMatic شود؛ این باید توسط nonReentrant رد شود.
contract MaliciousFeeReceiver {
    ITokenFactory public immutable factory;
    bool private attacking;

    constructor(address _factory) {
        factory = ITokenFactory(_factory);
    }

    receive() external payable {
        if (!attacking) {
            attacking = true;
            factory.createTokenWithMatic{value: msg.value}(
                "Reentrancy", "RNT", 1000, msg.value
            );
        }
    }
}
