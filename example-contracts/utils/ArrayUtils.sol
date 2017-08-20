pragma solidity ^0.4.11;

/**
 * @title Array Utilities
 * @dev Utilities to provide greater functionality when working with arrays.
 * @author Adam Lemmon <adam@oraclize.it>
 */
library ArrayUtils {


    /*************
     * atIndexes *
     *************
     * Supported:
     *    Type     Size  Indexes
     * 1. uint     4     2
     * 2. address  4     3
     * 2. bytes32  4     2
     * @dev Return the array elements at the passed in indexes
     * @param _array The array to grab indexes out of.
     * @param _indexes The indexes to return, limited to uint8.
     * @return A new array the size of the indexes passed in.
     */
    function atIndexes(uint[4] _array, uint8[2] _indexes)
        returns(uint[2] returnArray)
    {
      for (uint8 i = 0; i < _indexes.length; i++)
        returnArray[i] = _array[_indexes[i]];
    }

    function atIndexes(address[4] _array, uint8[3] _indexes)
        returns(address[3] returnArray)
    {
      for (uint8 i = 0; i < _indexes.length; i++)
        returnArray[i] = _array[_indexes[i]];
    }

    function atIndexes(bytes32[4] _array, uint8[2] _indexes)
        returns(bytes32[2] returnArray)
    {
      for (uint8 i = 0; i < _indexes.length; i++)
        returnArray[i] = _array[_indexes[i]];
    }
}
