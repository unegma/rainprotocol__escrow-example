import * as rainSDK from "rain-sdk"; // rain SDK imported using importmap in index.html (or in package.json)
import { ethers } from "ethers"; // ethers library imported using importmap in index.html (or in package.json)
import { connect } from "./connect.js"; // a very basic web3 connection implementation

/**
 * Escrow Example
 * Tutorials (see Getting Started): https://docs.rainprotocol.xyz
 * @returns {Promise<void>}
 */
export async function escrowExample() {
  try {
    const { signer, address } = await connect(); // get the signer and account address using a very basic connection implementation

    console.log('------------------------------'); // separator

    console.warn("Info: It is important to let your users know how many transactions to expect and what they are. " +
      "This example consists of X Transactions:\n\n"
    );

    // constants
    // TODO PUT YOUR SALE ADDRESS HERE
    const SALE_ADDRESS = 'myAddressFromOtherTutorial';
    // TODO PUT YOUR SALE ADDRESS HERE

    const EXAMPLE_ERC20_DECIMALS = 18; // See here for more info: https://docs.openzeppelin.com/contracts/3.x/erc20#a-note-on-decimals
    const EXAMPLE_ERC20_INITIAL_SUPPLY = 100;
    const EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT = 10;

    const emissionsERC20Config = {
      allowDelegatedClaims: true, // todo what is this?
      erc20Config: {
        name: 'Example Token',
        symbol: 'eTKN',
        distributor: '0x0000000000000000000000000000000000000000',
        initialSupply: ethers.utils.parseUnits(EXAMPLE_ERC20_INITIAL_SUPPLY.toString(), EXAMPLE_ERC20_DECIMALS),
      },
      // todo need code for immediate mint
      vmStateConfig: {
        sources: [],
        constants: [],
        stackLength: [],
        argumentsLength: []
      }
    };

    console.log('------------------------------'); // separator

    console.warn('Info: BEFORE DOING THIS TUTORIAL, MAKE SURE YOU HAVE CREATED A SALE FROM THE PREVIOUS TUTORIAL (MAKE SURE YOU DID NOT CLOSE IT)');

    console.log('------------------------------'); // separator

    console.log('### Section 1: Mint erc20 Token');
    console.log("Info: Minting new ERC20 with the following state:", emissionsERC20Config);
    const erc20 = await rainSDK.EmissionsERC20.deploy(signer, emissionsERC20Config);
    console.log('Result: erc20:', erc20);
    const TOKEN_ADDRESS = erc20.address;

    console.log('------------------------------'); // separator

    console.log('### Section 2: Add Token to Escrow and Link to Sale');
    console.log("Info: Adding token to escrow and linking to your Sale:", TOKEN_ADDRESS);
    const redeemableERC20ClaimEscrow = await rainSDK.RedeemableERC20ClaimEscrow.get(SALE_ADDRESS, TOKEN_ADDRESS, signer);
    console.log('Info: redeemableERC20ClaimEscrow:', redeemableERC20ClaimEscrow);
    const depositTransaction = await redeemableERC20ClaimEscrow.deposit(
      ethers.utils.parseUnits(EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT.toString(), EXAMPLE_ERC20_DECIMALS)
    );
    const depositReceipt = await depositTransaction.wait();
    console.log('Info: Token Deposit Receipt:', depositReceipt);

    console.log('------------------------------'); // separator

    console.log('### Section 3: Close Sale');
    console.log('Info: Ending The Sale.');
    const saleContract = new rainSDK.Sale(SALE_ADDRESS, signer);
    const endStatusTransaction = await saleContract.end();
    const endStatusReceipt = await endStatusTransaction.wait();
    console.log('Info: Sale Ended Receipt:', endStatusReceipt);

    console.log('------------------------------'); // separator

    console.log('### Section 4: Withdrawing Token');
    console.log(`Info: you should now be able to claim your token ${TOKEN_ADDRESS}:`);
    const withdrawTransaction = await redeemableERC20ClaimEscrow.withdraw(
      ethers.utils.parseUnits(EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT.toString(), EXAMPLE_ERC20_DECIMALS)
    );
    const withdrawReceipt = await withdrawTransaction.wait();
    console.log(`Info: receipt for withdrawal (please check your wallet to make sure you have the token, you may need to add the address for the token ${TOKEN_ADDRESS}):`, withdrawReceipt);

    console.log('------------------------------'); // separator

    console.log("Info: Done");
  } catch (err) {
    console.log(err);
  }
}

escrowExample();
