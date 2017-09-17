pragma solidity ^0.4.11;

import './ERC20.sol';
import '../utils/SafeMath.sol';
import '../utils/LoggingErrors.sol';

/**
 * @title BLG Token
 * @author Adam Lemmon <adam@blockchainlearninggroup.com>
 * @dev A reward token for participants in the BLG community.
 */
contract BLG is ERC20, LoggingErrors {

  using SafeMath for uint256;

  /**
   * Storage
   *
   */
  uint public constant DECIMALS = 18;
  string public constant NAME = 'BLG';

  // Amount of tokens currentl in circulation
  uint256 public totalSupply_;

  // User balances on blg tokens
  mapping (address => uint256) public balances_;

  // Allowances that a user has given to another user in order to allow then to spend
  // tokens on their behalf
  // owner => approved spender => amount
  // ie. bob => alice => 100 means that bob has approved alice to spend 100 of his tokens.
  mapping(address => mapping (address => uint256)) public allowed_;

  address public blg_; // EOA
  address public blgHub_; // hub contract
  bool public active_; // active after the blg hub has been set

  /**
   * Events
   */
  event Transfer (address indexed _from, address indexed _to, uint256 _value);
  event LogTokensMinted (address indexed _to, address to, uint256 value, uint256 totalSupply);
  event LogActivated(bool active);

  /**
   * @dev CONSTRUCTOR - set blg owner account
   */
  function BLG () {
    blg_ = msg.sender;
    active_ = false;
  }

  /**
   * External
   */

  /**
   * @dev Approve a user to spend your tokens.
   * @param _spender The user to spend your tokens.
   * @param _amount The amount to increase the spender's allowance by. Totaling
   * the amount of tokens they may spend on the senders behalf.
   * @return The success of this method.
   */
  function approve(address _spender, uint256 _amount)
    external
    returns (bool)
  {
    if (_amount <= 0)
      return error('Can not approve an amount <= 0, BLG.approve()');

    if (_amount > balances_[msg.sender])
      return error('Amount is greater than senders balance, BLG.approve()');

    allowed_[msg.sender][_spender] = allowed_[msg.sender][_spender].add(_amount);

    return true;
  }

  /**
   * @dev Mint tokens and allocate them to the specified user.
   * @param _to The address of the recipient.
   * @param _value The amount of tokens to be minted and transferred.
   * @return Success of the transaction.
   */
  function mint (address _to, uint _value)
    external
    returns (bool)
  {
    if (!active_)
      return error('BLG is not yet active, BLG.mint()');

    if (msg.sender != blgHub_ && msg.sender != blg_)
      return error('msg.sender != blgHub or blg, BLG.mint()');

    if (_value <= 0)
      return error('Cannot mint a value of <= 0, BLG.mint()');

    if (_to == address(0))
      return error('Cannot mint tokens to address(0), BLG.mint()');

    totalSupply_ = totalSupply_.add(_value);
    balances_[_to] = balances_[_to].add(_value);

    LogTokensMinted(_to, _to, _value, totalSupply_);

    return true;
  }

  /**
   * @dev Set the address of the blg hub contract and activate token.
   * @param _blgHub The blg hub contract.
   * @return Success of the transaction.
   */
  function setBLGHub (
    address _blgHub
  ) external
    returns (bool)
  {
    if (msg.sender != blg_)
      return error('msg.sender != blg, BLG.setBLGHub()');

    if (_blgHub == address(0))
      return error('Invalid hub address, blgHub == address(0), BLG.setBLGHub()');

    blgHub_ = _blgHub;
    active_ = true;

    LogActivated(true);

    return true;
  }

  /**
   * @dev send `_value` token to `_to` from `msg.sender`
   * @param _to The address of the recipient, sent from msg.sender.
   * @param _value The amount of token to be transferred
   * @return Whether the transfer was successful or not
   */
  function transfer (
    address _to,
    uint256 _value
  ) external
    returns (bool)
  {
    if (!active_)
      return error('BLG is not yet active, BLG.setBLGHub()');

    balances_[msg.sender] = balances_[msg.sender].sub(_value);
    balances_[_to] = balances_[_to].add(_value);

    Transfer(msg.sender, _to, _value);

    return true;
  }

  /**
   * @param _from The address transferring from.
   * @param _to The address transferring to.
   * @param _amount The amount to transfer.
   * @return The success of this method.
   */
  function transferFrom(address _from, address _to, uint256 _amount)
    external
    returns (bool)
  {
    if (_amount <= 0)
      return error('Cannot transfer amount <= 0, BLG.transferFrom()');

    if (_amount > balances_[_from])
      return error('From account has an insufficient balance, BLG.transferFrom()');

    if (_amount > allowed_[_from][msg.sender])
      return error('msg.sender has insufficient allowance, BLG.transferFrom()');

    balances_[_from] = balances_[_from].sub(_amount);
    allowed_[_from][msg.sender] = allowed_[_from][msg.sender].sub(_amount);
    balances_[_to] = balances_[_to].add(_amount);

    Transfer(_from, _to, _amount);

    return true;
  }

  // Constants

  /**
   * @return total amount of tokens.
   */
  function totalSupply ()
    external
    constant
    returns (uint256)
  {
    return totalSupply_;
  }

  /**
   * @param _owner The address from which the balance will be retrieved.
   * @return The balance
   */
  function balanceOf (
    address _owner
  ) external
    constant
    returns (uint256)
  {
    return balances_[_owner];
  }
}
