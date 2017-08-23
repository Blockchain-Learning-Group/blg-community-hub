pragma solidity ^0.4.11;

/**
 * @title Relay Storage
 * @dev As the relay must be a library and therefore may not possess storage this
 * contract serves to storage the required data for the relay.  Notably storing
 * the current library to delegate to, the return data sizes as well as past
 * versions in the case of rollbacks.
 */
contract RelayStorage {
  /**
   * Storage
   */
  address public currentLib_;
  mapping(uint => address) libVersions_;
  mapping(bytes4 => uint32) public returnSizes_; // Req'd to delegatecall

  /**
   * @dev CONSTRUCTOR - Set the curreny version of the lib.
   * @param _currentLib The address of the current lib contract.
   */
  function RelayStorage(address _currentLib) {
    upgrade(1, _currentLib);
  }

  /**
   * @dev Add a new function signature mapped to its return size.
   * @param _funcSig The signature of the function, ie. 'getUint()'
   * @param _returnSize The size of the return data from the function.
   */
  function addReturnDataSize(
    string _funcSig,
    uint32 _returnSize
  ) external
  {
    /* TODO check that this func sig does not already exist */
    returnSizes_[bytes4(sha3(_funcSig))] = _returnSize;
  }

  /**
   * @dev Upgrade to a new contract version.
   * @param _versionNumber The version to associate this address with.
   * @param  _newLib The address of the new library.
   */
  function upgrade(
    uint _versionNumber,
    address _newLib
  ) public {
    /* TODO check that this version does not already exist! */

    libVersions_[_versionNumber] = _newLib;
    currentLib_ = _newLib;
  }

  /**
   * @dev Upgrade to a new contract version.
   * @param _versionNumber The version to rollback to.
   */
  function rollback(
    uint _versionNumber
  ) external {
    /* TODO check that version exists! */
    currentLib_ = libVersions_[_versionNumber];
  }
}
