pragma solidity ^0.4.11;

import './Wallet.sol';
import './utils/SafeMath.sol';
import './utils/LoggingErrors.sol';
import './utils/ArrayUtils.sol';

/**
 * @title Decentralized exchange for ether and ERC20 tokens.
 * @author Adam Lemmon <adam@oraclize.it>
 * @dev All trades brokered by this contract.
 * Orders submitted by off chain order book and this contract handles
 * verification and execution of orders.
 * All value between parties is transferred via this exchange.
 * Methods arranged by visibility; external, public, internal, private and alphabatized within.
 */
contract Exchange is LoggingErrors {

  using SafeMath for uint;
  using ArrayUtils for *;  // All array types

  /**
   * Constants
   */
  uint private constant MINIMUM_TRANSFER_AMOUNT = 1;  /* TODO: Define this and the logic */

  /**
   * Data Structures
   */
  struct Order {
    bool active_;  // True: active, False: filled or cancelled
    address offerToken_;
    uint offerTokenTotal_;
    uint offerTokenRemaining_;  // Amount left to give
    address wantToken_;
    uint wantTokenTotal_;
    uint wantTokenReceived_;  // Amount left to receive, note may exceed want total
  }

  /**
   * Storage
   */
  address private ORDER_BOOK_ACCOUNT; // "Constant" set in constructor
  address private owner_;

  mapping(bytes32 => Order) public orders_; // Map order hashes to order data struct
  mapping(address => address) public userAccountToWallet_; // User EOA to wallet addresses

  /**
   * Events
   */
  event LogOrderExecutionSuccess();
  event LogOrderFilled(bytes32 indexed orderIdIndexed, bytes32 orderId, uint fillAmount, uint fillRemaining);
  event LogWalletDeposit(address indexed walletAddress, address token, uint amount, uint balance);
  event LogWalletWithdrawal(address indexed walletAddress, address token, uint amount, uint balance);

  /**
   * @dev Contract constructor - CONFIRM matches contract name.  Set owner and addr of order book.
   * @param _bookAccount The EOA address for the order book, will submit ALL orders.
   */
  function Exchange(address _bookAccount) {
      owner_ = msg.sender;
      ORDER_BOOK_ACCOUNT = _bookAccount;
  }

  /**
   * @dev Fallback. wallets utilize to send ether in order to broker trade.
   */
  function () public payable { }

  /**
   * External
   */

  /**
   * @dev Add a new user to the exchange, create a wallet for them.
   * Map their account address to the wallet contract for lookup.
   * @param _userAccount The address of the user's EOA.
   * @return Success of the transaction, false if error condition met.
   */
  function addNewUser(address _userAccount)
    external
    returns (bool)
  {
    if (msg.sender != owner_)
      return error('msg.sender != owner, Exchange.addNewUser()');

    if (userAccountToWallet_[_userAccount] != address(0))
      return error('User already exists, Exchange.addNewUser()');

    // Pass the userAccount address to wallet constructor so owner is not the exchange contract
    userAccountToWallet_[_userAccount] = new Wallet(_userAccount);

    return true;
  }

  /**
   * @dev Execute an order that was submitted by the external order book server.
   * The order book server believes it to be a match.
   * There are components for both orders, maker and taker, 2 signatures as well.
   * @param _token_and_EOA_Addresses The addresses of the maker and taker EOAs and offered token contracts.
   * [makerEOA, makerOfferToken, takerEOA, takerOfferToken]
   * @param _amounts The amount of tokens, [makerOffer, makerWant, takerOffer, takerWant].
   * @param _expirationBlock_and_Salt The block number at which this order expires
   * and a random number to mitigate replay. [makerExpiry, makerSalt, takerExpiry, takerSalt]
   * @param _sig_v ECDSA signature parameter v, maker 0 and taker 1.
   * @param _sig_r_and_s ECDSA signature parameters r ans s, maker 0, 1 and taker 2, 3.
   * @return Success of the transaction, false if error condition met.
   * Like types grouped to eliminate stack depth error
   */
  function executeOrder(
    address[4] _token_and_EOA_Addresses,
    uint[4] _amounts,
    uint[4] _expirationBlock_and_Salt,
    uint8[2] _sig_v,
    bytes32[4] _sig_r_and_s
  ) external
    returns(bool)
  {
    // Basic pre-conditions, return if any input data is invalid
    if(!__executeOrderInputIsValid__(
      msg.sender,
      _token_and_EOA_Addresses,
      _amounts,
      _expirationBlock_and_Salt.atIndexes([0, 2])  // maker and taker expiries
    ))
      return error('Input is invalid, Exchange.executeOrder()');

    /*
    Verify Maker and Taker signatures
    */
    bytes32 makerOrderHash = __generateOrderHash__(
      _token_and_EOA_Addresses.atIndexes([0, 1, 3]), // [makerEOA, makerOfferToken, makerWantToken]
      _amounts.atIndexes([0, 1]), // [makerOfferTokenAmount, makerWantTokenAmount]
      _expirationBlock_and_Salt.atIndexes([0, 1]) // [expiry, salt]
    );

    bytes32 takerOrderHash = __generateOrderHash__(
      _token_and_EOA_Addresses.atIndexes([2, 3, 1]), // [takerEOA, takerOfferToken, takerWantToken]
      _amounts.atIndexes([2, 3]), // [takerOfferTokenAmount, takerWantTokenAmount]
      _expirationBlock_and_Salt.atIndexes([2, 3]) // [expiry, salt]
    );

    if (!__signatureIsValid__(
      _token_and_EOA_Addresses[0],
      makerOrderHash,
      _sig_v[0],
      _sig_r_and_s.atIndexes([0, 1])
    ))
      return error('Maker signature is invalid, Exchange.executeOrder()');

    if (!__signatureIsValid__(
      _token_and_EOA_Addresses[2],
      takerOrderHash,
      _sig_v[1],
      _sig_r_and_s.atIndexes([2, 3])
    ))
      return error('Taker signature is invalid, Exchange.executeOrder()');

    /*
    Exchange Order Verification and matching.
    */
    Order memory makerOrder = orders_[makerOrderHash];
    Order memory takerOrder = orders_[takerOrderHash];

    if (makerOrder.wantTokenTotal_ == 0) {  // Check for existence
      makerOrder.active_ = true;
      makerOrder.offerToken_ = _token_and_EOA_Addresses[1];
      makerOrder.offerTokenTotal_ = _amounts[0];
      makerOrder.offerTokenRemaining_ = _amounts[0]; // Amount to give
      makerOrder.wantToken_ = _token_and_EOA_Addresses[3];
      makerOrder.wantTokenTotal_ = _amounts[1];
      makerOrder.wantTokenReceived_ = 0; // Amount received
    }

    if (takerOrder.wantTokenTotal_ == 0) {  // Check for existence
      takerOrder.active_ = true;
      takerOrder.offerToken_ = _token_and_EOA_Addresses[3];
      takerOrder.offerTokenTotal_ = _amounts[2];
      takerOrder.offerTokenRemaining_ = _amounts[2];  // Amount to give
      takerOrder.wantToken_ = _token_and_EOA_Addresses[1];
      takerOrder.wantTokenTotal_ = _amounts[3];
      takerOrder.wantTokenReceived_ = 0; // Amount received
    }

    if (!__ordersMatch_and_AreVaild__(makerOrder, takerOrder))
      return error('Orders do not match, Exchange.executeOrder()');

    // Trade amounts
    uint toTakerAmount;
    uint toMakerAmount;
    (toTakerAmount, toMakerAmount) = __getTradeAmounts__(makerOrder, takerOrder);

    // Wallet Order Verification, reach out to the maker and taker wallets.
    if (!__ordersVerifiedByWallets__(_token_and_EOA_Addresses, toMakerAmount, toTakerAmount))
      return error('Order could not be verified by wallets, Exchange.executeOrder()');

    /*
    Order Execution, Order Fully Verified by this point, time to execute!
    */
    // Local order structs
    __updateOrders__(makerOrder, takerOrder, toTakerAmount, toMakerAmount);

    // Write to storage then external calls
    //  Update orders active flag if filled
    if (makerOrder.offerTokenRemaining_ == 0)
      makerOrder.active_ = false;

    if (takerOrder.offerTokenRemaining_ == 0)
      takerOrder.active_ = false;

    // Finally write orders to storage
    orders_[makerOrderHash] = makerOrder;
    orders_[takerOrderHash] = takerOrder;

    // Transfer the external value, ether <> tokens
    assert(
      __executeTokenTransfer__(_token_and_EOA_Addresses, toTakerAmount, toMakerAmount)
    );

    // Log the order id(hash), amount of offer given, amount of offer remaining
    LogOrderFilled(makerOrderHash, makerOrderHash, toTakerAmount, makerOrder.offerTokenRemaining_);
    LogOrderFilled(takerOrderHash, takerOrderHash, toMakerAmount, takerOrder.offerTokenRemaining_);

    LogOrderExecutionSuccess();

    return true;
  }

  /*
   Methods to catch events from external contracts, user wallets primarily
   */

  /**
   * @dev Simply log the event to track wallet interaction off-chain
   * @param _token The address of the token that was deposited.
   * @param _amount The amount of the token that was deposited.
   * @param _walletBalance The updated balance of the wallet after deposit.
   */
  function walletDeposit(
    address _token,
    uint _amount,
    uint _walletBalance
  ) external
  {
    LogWalletDeposit(msg.sender, _token, _amount, _walletBalance);
  }

  /**
   * @dev Simply log the event to track wallet interaction off-chain
   * @param _token The address of the token that was deposited.
   * @param _amount The amount of the token that was deposited.
   * @param _walletBalance The updated balance of the wallet after deposit.
   */
  function walletWithdrawal(
    address _token,
    uint _amount,
    uint _walletBalance
  ) external
  {
    LogWalletWithdrawal(msg.sender, _token, _amount, _walletBalance);
  }

  /**
   * Private
   */

  /**
   * @dev Verify the input to order execution is valid.
   * 1. Sent from order book. 2. Has not expired. 3. Maker and Taker wallet contracts exist.
   * 4. One of the token address is 0, ether, but NOT both.  5. Neither of the token amounts are 0.
   * @param _sender Address of the msg sender.
   * @param _token_and_EOA_Addresses The addresses of the maker and taker EOAs and offered token contracts.
   * [makerEOA, makerOfferToken, takerEOA, takerOfferToken]
   * @param _amounts The amount of tokens, [makerOffer, makerWant, takerOffer, takerWant].
   * @param _expirationBlocks The block number at which this order expires, maker and taker.
   * @return Success if all checks pass.
   */
  function __executeOrderInputIsValid__(
    address _sender,
    address[4] _token_and_EOA_Addresses,
    uint[4] _amounts,
    uint[2] _expirationBlocks
  ) private
    constant
    returns (bool)
  {
    if (_sender != ORDER_BOOK_ACCOUNT)
      return error('msg.sender != ORDER_BOOK_ACCOUNT, Exchange.__executeOrderInputIsValid__()');

    if (block.number > _expirationBlocks[0])
      return error('Maker order has expired, Exchange.__executeOrderInputIsValid__()');

    if (block.number > _expirationBlocks[1])
      return error('Taker order has expired, Exchange.__executeOrderInputIsValid__()');

    /*
    Wallets
    */
    if (userAccountToWallet_[_token_and_EOA_Addresses[0]] == address(0))
      return error('Maker wallet does not exist, Exchange.__executeOrderInputIsValid__()');

    if (userAccountToWallet_[_token_and_EOA_Addresses[2]] == address(0))
      return error('Taker wallet does not exist, Exchange.__executeOrderInputIsValid__()');

    /*
    Tokens, addresses and amounts, ether exists
    */
    if (!(_token_and_EOA_Addresses[1] == address(0) || _token_and_EOA_Addresses[3] == address(0)))
      return error('Ether omitted! Is not offered by either the Taker or Maker, Exchange.__executeOrderInputIsValid__()');

    if (_token_and_EOA_Addresses[1] == address(0) && _token_and_EOA_Addresses[3] == address(0))
      return error('Taker and Maker offer token are both ether, Exchange.__executeOrderInputIsValid__()');

    if (_amounts[0] == 0 || _amounts[1] == 0 || _amounts[2] == 0 || _amounts[3] == 0)
      return error('May not execute an order where token amount == 0, Exchange.__executeOrderInputIsValid__()');

    return true;
  }

  /**
   * @dev Execute the external transfer of tokens.
   * @param _token_and_EOA_Addresses The addresses of the maker and taker EOAs and offered token contracts.
   * [makerEOA, makerOfferToken, takerEOA, takerOfferToken]
   * @param _toTakerAmount The amount of tokens to transfer to the taker.
   * @param _toMakerAmount The amount of tokens to transfer to the maker.
   * @return Success if both wallets verify the order.
   */
  function __executeTokenTransfer__(
    address[4] _token_and_EOA_Addresses,
    uint _toTakerAmount,
    uint _toMakerAmount
  ) private
    returns (bool)
  {
    /*
    Wallet mapping balances
    */
    address makerOfferToken = _token_and_EOA_Addresses[1];
    address takerOfferToken = _token_and_EOA_Addresses[3];

    Wallet makerWallet = Wallet(userAccountToWallet_[_token_and_EOA_Addresses[0]]);
    Wallet takerWallet = Wallet(userAccountToWallet_[_token_and_EOA_Addresses[2]]);

    // Move the toTakerAmount from the maker to the taker
    if (!makerWallet.updateBalance(makerOfferToken, _toTakerAmount, true))  // Subtraction flag
      return error('Unable to subtract maker token from maker wallet, Exchange.__executeTokenTransfer__()');

    if (!takerWallet.updateBalance(makerOfferToken, _toTakerAmount, false))
      return error('Unable to add maker token to taker wallet, Exchange.__executeTokenTransfer__()');

    // Move the toMakerAmount from the taker to the maker
    if (!takerWallet.updateBalance(takerOfferToken, _toMakerAmount, true))  // Subtraction flag
      return error('Unable to subtract taker token from taker wallet, Exchange.__executeTokenTransfer__()');

    if (!makerWallet.updateBalance(takerOfferToken, _toMakerAmount, false))
      return error('Unable to add taker token to maker wallet, Exchange.__executeTokenTransfer__()');

    /*
    Contract ether balances and token contract balances
    */
    // Ether to the taker and tokens to the maker
    if (makerOfferToken == address(0)) {
      takerWallet.transfer(_toTakerAmount);
      assert(
        Token(takerOfferToken).transferFrom(takerWallet, makerWallet, _toMakerAmount)
      );

    // Ether to the maker and tokens to the taker
    } else if (takerOfferToken == address(0)) {
      makerWallet.transfer(_toMakerAmount);
      assert(
        Token(makerOfferToken).transferFrom(makerWallet, takerWallet, _toTakerAmount)
      );

    // Something went wrong one had to have been ether
    } else revert();

    return true;
  }

  /**
   * @dev Calculates Keccak-256 hash of order with specified parameters.
   * @param _token_and_EOA_Addresses The addresses of the order, [makerEOA, makerOfferToken, makerWantToken].
   * @param _amounts The amount of tokens, [makerOffer, makerWant].
   * @param _expirationBlock_and_Salt The block number at which this order expires and random salt number.
   * @return Keccak-256 hash of the order.
   */
  function __generateOrderHash__(
    address[3] _token_and_EOA_Addresses,
    uint[2] _amounts,
    uint[2] _expirationBlock_and_Salt
  ) private
    constant
    returns (bytes32)
  {
    return keccak256(
      address(this),
      _token_and_EOA_Addresses[0], // _makerEOA
      _token_and_EOA_Addresses[1], // offerToken
      _amounts[0],  // offerTokenAmount
      _token_and_EOA_Addresses[2], // wantToken
      _amounts[1],  // wantTokenAmount
      _expirationBlock_and_Salt[0], // expiry
      _expirationBlock_and_Salt[1] // salt
    );
  }

  /**
   * @dev Returns the price ratio for this order and confirms valid
   * Compute and return the ether / token price.
   * @param _makerOrder The maker order data structure.
   * @param _takerOrder The taker order data structure.
   * @return The ratio to 3 decimal places.
   */
  function __getOrderPriceRatio__(
    Order _makerOrder,
    Order _takerOrder
  ) private
    constant
    returns (uint orderPriceRatio)
  {
    // Ratio = ether amount / token amount
    if (_makerOrder.offerToken_ == address(0)) {
      orderPriceRatio = _makerOrder.offerTokenTotal_.mul(1000).div(_makerOrder.wantTokenTotal_);

    } else if (_takerOrder.offerToken_ == address(0)) {
      orderPriceRatio = _makerOrder.wantTokenTotal_.mul(1000).div(_makerOrder.offerTokenTotal_);

    } else revert();  // Neither ether
  }

  /**
   * @dev Compute the tradeable amounts of the two verified orders.
   * Token amount is the min remaining between want and offer of the two orders that isn't ether.
   * Ether amount is then: etherAmount = tokenAmount * priceRatio, as ratio = eth / token.
   * @param _makerOrder The maker order data structure.
   * @param _takerOrder The taker order data structure.
   * @return The amount moving from makerOfferRemaining to takerWantRemaining and vice versa.
   * TODO: consider rounding errors, etc
   */
  function __getTradeAmounts__(
    Order _makerOrder,
    Order _takerOrder
  ) private
    constant
    returns (uint toTakerAmount, uint toMakerAmount)
  {
    uint priceRatio = __getOrderPriceRatio__(_makerOrder, _takerOrder);

    // Amount left for order to receive
    uint makerAmountLeftToReceive = _makerOrder.wantTokenTotal_.sub(_makerOrder.wantTokenReceived_);
    uint takerAmountLeftToReceive = _takerOrder.wantTokenTotal_.sub(_takerOrder.wantTokenReceived_);

    // Ether moving taker => maker, toMakerAmount == ether and toTakerAmount == token
    if (_makerOrder.wantToken_ == address(0)) {
      toTakerAmount = __min__(_makerOrder.offerTokenRemaining_, takerAmountLeftToReceive);
      toMakerAmount = toTakerAmount.mul(priceRatio).div(1000); // Get back to 0 decimals

    // Ether moving maker => taker, toTakerAmount == ether and toMakerAmount == token
    } else if (_takerOrder.wantToken_ == address(0)) {
      toMakerAmount = __min__(makerAmountLeftToReceive, _takerOrder.offerTokenRemaining_);
      toTakerAmount = toMakerAmount.mul(priceRatio).div(1000); // Get back to 0 decimals

    } else revert();  // Error neither tokens were ether
  }

  /**
   * @dev Return the minimum of two uint
   * @param _a Uint 1
   * @param _b Uint 2
   * @return The smallest value or b is equal
   */
  function __min__(uint _a, uint _b)
    private
    constant
    returns (uint)
  {
    return _a < _b ? _a : _b;
  }

  /**
   * @dev Confirm that the orders do match and are valid.
   * @param _makerOrder The maker order data structure.
   * @param _takerOrder The taker order data structure.
   * @return Bool if the orders passes all checks.
   */
  function __ordersMatch_and_AreVaild__(
    Order _makerOrder,
    Order _takerOrder
  ) private
    constant
    returns (bool)
  {
    /*
    Orders still active
    */
    if (!_makerOrder.active_)
      return error("Maker order is inactive, Exchange.__ordersMatch_and_AreVaild__()");

    if (!_takerOrder.active_)
      return error("Taker order is inactive, Exchange.__ordersMatch_and_AreVaild__()");

    /*
    Confirm tokens match
    */
    /* NOTE potentially omit as matching handled upstream? */
    if (_makerOrder.wantToken_ != _takerOrder.offerToken_)
      return error('Maker wanted token does not match taker offer token, Exchange.__ordersMatch_and_AreVaild__()');

    if (_makerOrder.offerToken_ != _takerOrder.wantToken_)
      return error('Maker offer token does not match taker wanted token, Exchange.__ordersMatch_and_AreVaild__()');

    /*
    Sufficient remaining balances to trade
    */
    uint makerAmountLeftToReceive = _makerOrder.wantTokenTotal_.sub(_makerOrder.wantTokenReceived_);
    uint takerAmountLeftToReceive = _takerOrder.wantTokenTotal_.sub(_takerOrder.wantTokenReceived_);

    // Taker to Maker
    if (__min__(makerAmountLeftToReceive, _takerOrder.offerTokenRemaining_) < MINIMUM_TRANSFER_AMOUNT)
      return error("Insufficient balance to transfer to the maker, Exchange.__ordersMatch_and_AreVaild__()");

    // Maker to Taker
    if (__min__(_makerOrder.offerTokenRemaining_, takerAmountLeftToReceive) < MINIMUM_TRANSFER_AMOUNT)
      return error("Insufficient balance to transfer to the taker, Exchange.__ordersMatch_and_AreVaild__()");

    /*
    Price Ratios, to 3 decimal places hence * 1000
    Ratios are relative to eth, amount of ether for a single token, ie. ETH / GNO == 0.2 Ether per 1 Gnosis
    */
    uint orderPrice;  // The price the maker is willing to accept
    uint offeredPrice; // The offer the taker has given

    // Ratio = ether amount / token amount
    if (_makerOrder.offerToken_ == address(0)) {
      orderPrice = _makerOrder.offerTokenTotal_.mul(1000).div(_makerOrder.wantTokenTotal_);
      offeredPrice = _takerOrder.wantTokenTotal_.mul(1000).div(_takerOrder.offerTokenTotal_);

      // ie. Maker is offering 10 ETH for 100 GNO but taker is offering 100 GNO for 20 ETH, no match!
      // The taker wants more ether than the maker is offering.
      if (orderPrice < offeredPrice)
        return error("Maker offering X ether for Y tokens but the taker wants >X ether for Y tokens, orderPrice < offeredPrice, Exchange.__ordersMatch_and_AreVaild__()");

    } else if (_takerOrder.offerToken_ == address(0)) {
      orderPrice = _makerOrder.wantTokenTotal_.mul(1000).div(_makerOrder.offerTokenTotal_);
      offeredPrice = _takerOrder.offerTokenTotal_.mul(1000).div(_takerOrder.wantTokenTotal_);

      // ie. Maker is offering 100 GNO for 10 ETH but taker is offering 5 ETH for 100 GNO, no match!
      // The taker is not offering enough ether for the maker
      if (orderPrice > offeredPrice)
        return error("Maker offering Y tokens for X ether but the taker wants Y tokens for <X ether, orderPrice < offeredPrice, Exchange.__ordersMatch_and_AreVaild__()");

    } else revert();

    return true;
  }

  /**
   * @dev Ask each wallet to verify this order.
   * @param _token_and_EOA_Addresses The addresses of the maker and taker EOAs and offered token contracts.
   * [makerEOA, makerOfferToken, takerEOA, takerOfferToken]
   * @param _toMakerAmount The amount of tokens to be sent to the maker.
   * @param _toTakerAmount The amount of tokens to be sent to the taker.
   * @return Success if both wallets verify the order.
   */
  function __ordersVerifiedByWallets__(
    address[4] _token_and_EOA_Addresses,
    uint _toMakerAmount,
    uint _toTakerAmount
  ) private
    constant
    returns (bool)
  {
    // Instantiate user wallets
    Wallet makerWallet = Wallet(userAccountToWallet_[_token_and_EOA_Addresses[0]]);
    Wallet takerWallet = Wallet(userAccountToWallet_[_token_and_EOA_Addresses[2]]);

    // Have the transaction verified by both maker and taker wallets
    // confirm sufficient balance to transfer, offerToken and offerTokenAmount
    if(!makerWallet.verifyOrder(_token_and_EOA_Addresses[1], _toTakerAmount))
      return error("Maker wallet could not verify the order, Exchange.__ordersVerifiedByWallets__()");

    if(!takerWallet.verifyOrder(_token_and_EOA_Addresses[3], _toMakerAmount))
      return error("Taker wallet could not verify the order, Exchange.__ordersVerifiedByWallets__()");

    return true;
  }

  /**
   * @dev On chain verification of an ECDSA ethereum signature.
   * @param _signer The EOA address of the account that supposedly signed the message.
   * @param _orderHash The on-chain generated hash for the order.
   * @param _v ECDSA signature parameter v.
   * @param _r_and_s ECDSA signature parameters r and s, [r, s].
   * @return Bool if the signature is valid or not.
   */
  function __signatureIsValid__(
    address _signer,
    bytes32 _orderHash,
    uint8 _v,
    bytes32[2] _r_and_s
  ) private
    constant
    returns (bool)
  {
    address recoveredAddr = ecrecover(
      keccak256('\x19Ethereum Signed Message:\n32', _orderHash),
      _v, _r_and_s[0], _r_and_s[1]
    );

    return recoveredAddr == _signer;
  }

  /**
   * @dev Update the order structs.
   * @param _makerOrder The maker order data structure.
   * @param _takerOrder The taker order data structure.
   * @param _toTakerAmount The amount of tokens to be moved to the taker.
   * @param _toTakerAmount The amount of tokens to be moved to the maker.
   * @return Success if the update succeeds.
   */
  function __updateOrders__(
    Order _makerOrder,
    Order _takerOrder,
    uint _toTakerAmount,
    uint _toMakerAmount
  ) private
  {
    // taker => maker
    _makerOrder.wantTokenReceived_ = _makerOrder.wantTokenReceived_.add(_toMakerAmount);
    _takerOrder.offerTokenRemaining_ = _takerOrder.offerTokenRemaining_.sub(_toMakerAmount);

    // maker => taker
    _takerOrder.wantTokenReceived_ = _takerOrder.wantTokenReceived_.add(_toTakerAmount);
    _makerOrder.offerTokenRemaining_ = _makerOrder.offerTokenRemaining_.sub(_toTakerAmount);
  }
}
