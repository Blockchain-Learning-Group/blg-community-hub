pragma solidity ^0.4.11;

import './WalletLogic.sol';
import './utils/LoggingErrors.sol';
/**
 * @title Wallet to hold and trade ERC20 tokens and ether
 * @author Adam Lemmon <adam@oraclize.it>
 * @dev User wallet to interact with the exchange.
 * all tokens and ether held in this wallet, 1 to 1 mapping to user EOAs.
 */
contract Wallet is LoggingErrors {

  using WalletLogic for WalletLogic.WalletStorage;

  /**
  * Storage
  */
  WalletLogic.WalletStorage private wallet;

  /**
  * Events
  */
  event LogDeposit(address token, uint amount, uint balance);
  event LogWithdrawal(address token, uint amount, uint balance);

  /**
   * @dev Contract consturtor - CONFIRM matches contract name.
   * @param _owner The address of the user's EOA, wallets created from the exchange
   * so must past in the owner address, msg.sender == exchange.
   */
  function Wallet(address _owner) {
    wallet.init(msg.sender, _owner);
  }

  /**
   * @dev Fallback - Only enable funds to be sent from the exchange.
   * Ensures balances will be consistent.
   */
  function () public payable {
    require(msg.sender == wallet.exchange_);
  }

  /**
  * External
  */

  /**
   * @dev Deposit ether into this wallet, default to address 0 for consistent token lookup.
   */
  function depositEther()
    external
    payable
    returns(bool)
  {
    return wallet.deposit(address(0), msg.value);
  }

  /**
   * @dev Deposit any ERC20 token into this wallet.
   * @param _token The address of the existing token contract.
   * @param _amount The amount of tokens to deposit.
   * @return Bool if the deposit was successful.
   */
  function depositERC20Token(
    address _token,
    uint _amount
  ) external
    returns (bool)
  {
    // ether
    if (_token == 0) return error('Cannot deposit ether via depositERC20, Wallet.depositERC20Token()');
    return wallet.deposit(_token, _amount);
  }

  /**
   * @dev The result of an order, update the balance of this wallet.
   * @param _token The address of the token balance to update.
   * @param _amount The amount to update the balance by.
   * @param _subtractionFlag If true then subtract the token amount else add.
   * @return Bool if the update was successful.
   */
  function updateBalance(
    address _token,
    uint _amount,
    bool _subtractionFlag
  ) external
    returns (bool)
  {
    return wallet.updateBalance(_token, _amount, _subtractionFlag);
  }

  /**
   * @dev Verify an order that the Exchange has received involving this wallet.
   * Internal checks and then authorize the exchange to move the tokens.
   * If sending ether will transfer to the exchange to broker the trade.
   * @param _token The address of the token contract being sold.
   * @param _amount The amount of tokens the order is for.
   * @return If the order was verified or not.
   */
  function verifyOrder(address _token, uint _amount)
    external
    returns(bool)
  {
    return wallet.verifyOrder(_token, _amount);
  }

  /**
   * @dev Withdraw any token, including ether from this wallet to an EOA.
   * @param _token The address of the token to withdraw.
   * @param _amount The amount to withdraw.
   * @return Success of the withdrawal.
   */
  function withdraw(
    address _token,
    uint _amount
  ) returns(bool)
  {
    return wallet.withdraw(_token, _amount);
  }

  /**
  * Constants
  */

  /**
   * @dev Get the balance for a specific token.
   * @param _token The address of the token contract to retrieve the balance of.
   * @return The current balance within this contract.
   */
  function balanceOf(address _token)
    public
    constant
    returns(uint)
  {
    return wallet.tokenBalances_[_token];
  }
}
