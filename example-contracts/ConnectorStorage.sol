pragma solidity ^0.4.11;

/// @title ..
/// @dev ..
contract WalletConnectorStorage {
  /**
  * Storage
  */
  address public latestLib_;
  // Must know the return data size of functions in order to pass through
  mapping(bytes4 => uint32) public returnDataSizes_;

  /// @dev Constructor - CONFIRM matches contract name
  /// Init the latest library
  /// @param _library The address of the latest library
  function WalletConnectorStorage(address _library) {
    updateLibrary(_library);
  }

  /// @dev Add a new functions signature and return size to the mapping
  /// This must be done before a method may be invoked within the contract
  /// @param _funcSignature The signature of the function to add
  /// @param _returnSize The size, in bytes, of the function's return data
  function addReturnDataSize(
    string _funcSignature,
    uint32 _returnSize
  ) external
  {
    returnDataSizes_[bytes4(sha3(_funcSignature))] = _returnSize;
  }

  /// @dev Update the library to a different version
  /// @param _library The address of the latest library
  /*
    TODO;
      - permission this method, who can update?
      - Define opt-in logic?  How does a user approve?
  */
  function updateLibrary(address _library) public {
    latestLib_ = _library;
  }
}
