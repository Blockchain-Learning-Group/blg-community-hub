pragma solidity ^0.4.11;

/**
 * @title Error logging Support Library
 * @author Adam Lemmon <adam@oraclize.it>
 * @dev Library to enable error logging for various errors and a much improved debugging experience
 * To support various error types, params, etc.
 * Ensure that contract utilizing this library inherits LoggingErrors.sol or
 * Implements the same events as this lib so they are visible once emitted
 */
library ErrorLib {
  /**
  * Events
  */
  event LogErrorString(string errorString);

  /**
  * Error cases
  */

  /**
   * @dev Default error to simply log the error message and return false
   * @param _errorMessage The error message to log
   * @return ALWAYS false
   */
  function messageString(string _errorMessage) returns(bool) {
    LogErrorString(_errorMessage);
    return false;
  }
}
