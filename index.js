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

    // I'm writing a piece to show how the escrow works, and I will need the user to create an erc20 token as part of that process.
    //
    // They will:
    // 1. mint an erc20 token
    // 2. add it to an existing sale which they created in another tutorial
    // 3. close the sale
    // 4. see the erc20 token get added to their wallet from the escrow




    
  } catch (err) {
    console.log(err);
  }
}

escrowExample();
