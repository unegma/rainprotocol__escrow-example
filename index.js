import * as rainSDK from "rain-sdk"; // rain SDK imported using importmap in index.html (or in package.json)
import { ethers } from "ethers"; // ethers library imported using importmap in index.html (or in package.json)
import { connect } from "./connect.js"; // a very basic web3 connection implementation

/**
 * Escrow Example
 * Tutorial: https://docs.rainprotocol.xyz
 * @returns {Promise<void>}
 */
export async function escrowExample() {

  try {
    const { signer, address } = await connect(); // get the signer and account address using a very basic connection implementation
    
    // *** Code Goes Here ***
    
  } catch (err) {
    console.log(err);
  }
}

escrowExample();
