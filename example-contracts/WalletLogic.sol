pragma solidity ^0.4.11;

import './Exchange.sol';
import './utils/SafeMath.sol';
import { Token } from './token/ERC20Interface.sol';
import './utils/ErrorLib.sol';

/**
 * @title Wallet logic library
 * @dev Standard logic universally used by wallets.
 */
library WalletLogic {
  using SafeMath for uint;

  struct WalletStorage {
    address owner_;
    address exchange_;
    mapping(address => uint) tokenBalances_;
  }

  /**
  * Events
  */
  event LogDeposit(address token, uint amount, uint balance);
  event LogWithdrawal(address token, uint amount, uint balance);

  /**
  * Core library methods
  */

  /**
   * @dev Initialize the storage struct for a new wallet contract.
   * @param self The reference to the wallet's storage struct.
   * @param _exchange The address of the exchange contract.
   * @param _owner The address of the user's EOA.
   */
  function init(WalletStorage storage self, address _exchange, address _owner) {
    self.exchange_ = _exchange;
    self.owner_ = _owner;
  }

  /**
   * @dev Deposit ether or any ERC20 token into this wallet.
   * @param self The reference to the wallet's storage struct.
   * @param _token The address of the existing token contract, including ether.
   * @param _amount The amount of tokens to deposit.
   * @return If the funcion was successful.
   */
  function deposit(
    WalletStorage storage self,
    address _token,
    uint _amount
  ) returns (bool)
  {
    if (_amount <= 0)
      return ErrorLib.messageString('Token amount must be greater than 0, WalletLogic.deposit()');

    if (msg.sender != self.owner_)
      return ErrorLib.messageString('msg.sender != owner, WalletLogic.deposit()');

    // NOT depositing ether, must transfer the tokens to the calling contract
    if (_token != address(0)) {
      require(Token(_token).transferFrom(msg.sender, this, _amount));
    }

    self.tokenBalances_[_token] = self.tokenBalances_[_token].add(_amount);
    LogDeposit(_token, _amount, self.tokenBalances_[_token]);

    // Notify the exchange of the deposit
    Exchange(self.exchange_).walletDeposit(_token, _amount, self.tokenBalances_[_token]);

    return true;
  }

  /**
   * @dev Update the token balance within this wallet, increment or decrement.
   * @param self The reference to the wallet's storage struct.
   * @param _token The address of the token balance to update.
   * @param _amount The amount to update the balance by.
   * @param _subtractionFlag If true then subtract the token amount else add.
   * @return If the funcion was successful.
   */
  function updateBalance(
    WalletStorage storage self,
    address _token,
    uint _amount,
    bool _subtractionFlag
  ) returns (bool)
  {
    if (msg.sender != self.exchange_)
      return ErrorLib.messageString('msg.sender != exchange, WalletLogic.updateBalance()');

    if (_amount == 0)
      return ErrorLib.messageString('Cannot update by 0, WalletLogic.updateBalance()');

    // If sub then check the balance is sufficient in order to log the error
    if (_subtractionFlag) {
      if (self.tokenBalances_[_token] < _amount)
        return ErrorLib.messageString('Insufficient balance to subtract, WalletLogic.updateBalance()');

      self.tokenBalances_[_token] = self.tokenBalances_[_token].sub(_amount);

    } else {
      self.tokenBalances_[_token] = self.tokenBalances_[_token].add(_amount);
    }

    return true;
  }

  /**
   * @dev Verify an order that the Exchange has received involving this wallet.
   * Internal checks and then authorize the exchange to move the tokens.
   * If sending ether then will transfer to the exchange to broker the trade.
   * @param self The reference to the wallet's storage struct.
   * @param _token The address of the token contract being bought / sold
   * ether is buying, always selling ERC20 tokens.
   * @param _amount The amount of tokens the order is for.
   * @return If the funcion was successful.
   */
  /* TODO
  - what else should be verified here?
  */
  function verifyOrder(
    WalletStorage storage self,
    address _token,
    uint _amount
  ) returns(bool)
  {
    if (msg.sender != self.exchange_)
      return ErrorLib.messageString('msg.sender != exchange, WalletLogic.verifyOrder()');

    if (self.tokenBalances_[_token] < _amount)
      return ErrorLib.messageString('Insufficient funds in local mapping, WalletLogic.verifyOrder()');

    // If not ether this is a sell and suficient balance must also exist in token contract
    // If so, Grant pull permissions to the exchange contract if not ether
    if (_token != address(0)) {
      if (Token(_token).balanceOf(this) < _amount)  // token.balanceOf and self.tokenBalances do not match!!
        return ErrorLib.messageString('CRITICAL: Mismatch between balances, Insufficient funds in token contract, WalletLogic.verifyOrder()');

      assert(Token(_token).approve(msg.sender, _amount));

    // If ether this wallet must have suficient balance
    // If so, will send the ether to the exchange to broker the trade
    } else {
      if (this.balance < _amount)  // this.balance and self.tokenBalances do not match!!
        return ErrorLib.messageString('CRITICAL: Mismatch between balances, Insufficient ether balance in wallet contract, WalletLogic.verifyOrder()');

      self.exchange_.transfer(_amount);
    }

    return true;
  }

  /**
   * @dev Withdraw any token, including ether from this wallet to an EOA.
   * @param self The reference to the wallet's storage struct.
   * @param _token The address of the token to withdraw.
   * @param _amount The amount to withdraw.
   * @return Success of the withdrawal.
   */
  function withdraw(
    WalletStorage storage self,
    address _token,
    uint _amount
  ) returns(bool)
  {
    /*
     Checks
     */
    if(msg.sender != self.owner_)
      return ErrorLib.messageString('msg.sender != owner, WalletLogic.withdraw()');

    if(_amount == 0)
      return ErrorLib.messageString('May not withdraw an amount of 0, WalletLogic.withdraw()');

    if(self.tokenBalances_[_token] < _amount)
      return ErrorLib.messageString('Insufficient funds in wallet, WalletLogic.withdraw()');

    /*
     Effects
     */
    self.tokenBalances_[_token] = self.tokenBalances_[_token].sub(_amount);

    /*
     External interactions and final success events
     */
    if (_token== address(0))
      msg.sender.transfer(_amount);

    else assert(Token(_token).transfer(msg.sender, _amount));

    LogWithdrawal(_token, _amount, self.tokenBalances_[_token]);

    // Notify the exchange of the withdrawal
    Exchange(self.exchange_).walletWithdrawal(_token, _amount, self.tokenBalances_[_token]);

    return true;
  }
}
