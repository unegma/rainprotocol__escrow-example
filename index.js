import * as rainSDK from "rain-sdk"; // rain SDK imported using importmap in index.html (or in package.json)
import { ethers } from "ethers"; // ethers library imported using importmap in index.html (or in package.json)
import { connect } from "./connect.js"; // a very basic web3 connection implementation

/**
 * Escrow Example
 * Tutorials (see Getting Started): https://docs.rainprotocol.xyz
 * @returns {Promise<void>}
 */
export async function escrowExample() {

  // todo maybe warn users they will need to have X matic in their wallet in order to complete ALL the transactions

  // todo you will need to have completed the sale tutorial, purchased an item, and then closed the sale in order to use this example

  try {
    const { signer, address } = await connect(); // get the signer and account address using a very basic connection implementation

    console.log('------------------------------'); // separator

    console.warn("Info: It is important to let your users know how many transactions to expect and what they are. " +
      "This example consists of X Transactions:\n\n"
    );

    console.log('------------------------------'); // separator

    console.warn('Info: BEFORE DOING THIS TUTORIAL, MAKE SURE YOU HAVE CREATED (AND NOT CLOSED) A SALE FROM THE PREVIOUS TUTORIAL AND ADDED THE ADDRESS TO: \n`const SALE_ADDRESS = \'myAddressFromOtherTutorial\';`');

    console.log('------------------------------'); // separator

    // constants

    // TODO PUT YOUR SALE ADDRESS HERE
    // const SALE_ADDRESS = '0xcaed7C5344b0755f282c71259E4556bA23dD3450';
    const SALE_ADDRESS = '0x1F73226Ea909A3e681ba39A7418C9EfAfEb96A2d'; // a closed sale from which you own an rTKN
    // TODO PUT YOUR SALE ADDRESS HERE

    const EXAMPLE_ERC20_DECIMALS = 18; // See here for more info: https://docs.openzeppelin.com/contracts/3.x/erc20#a-note-on-decimals
    const EXAMPLE_ERC20_INITIAL_SUPPLY = 10;
    const EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT = 10;

    // can add to escrow when sale is complete,
    // a. check the supply of rTKN when a sale is complete
    // b. deposit an amount of erc20 tokens based on that number into an escrow
    // c. users can only claim 1 token each

    const emissionsERC20Config = {
      allowDelegatedClaims: false, // can mint on behalf of someone else
      erc20Config: {
        name: 'inStore15PercentOffVoucher',
        symbol: 'iSV15',
        distributor: address, // initialSupply is given to the distributor during the deployment of the emissions contract
        initialSupply: ethers.utils.parseUnits(EXAMPLE_ERC20_INITIAL_SUPPLY.toString(), EXAMPLE_ERC20_DECIMALS), // TODO CHECK UNDERSTANDING HOW TO LIMIT CORRECTLY, AND TO WHERE THIS GOES ON DEPLOYING THE CONTRACT (distributor?)
      },
      vmStateConfig: {
        // setting to 0 will fix intitial supply when the claim function is called
        constants: [0], // mint 1 at a time (infinitely), if set to 10, will mint 10 at a time, no more no less (infinitely)
        sources: [
          ethers.utils.concat([
            rainSDK.utils.op(rainSDK.Sale.Opcodes.VAL, 0),
          ]),
        ],
        stackLength: 1,
        argumentsLength: 0,
      },
    };

    console.log('### Section 1: Mint erc20 Token');
    console.log("Info: Minting new ERC20 with the following state:", emissionsERC20Config);
    const erc20 = await rainSDK.EmissionsERC20.deploy(signer, emissionsERC20Config);

    // todo claim function will mint another token (in addition to initial supply)

    console.log('Result: erc20:', erc20);
    const TOKEN_ADDRESS = erc20.address;

    console.log('------------------------------'); // separator

    console.log('### Section 2: Add Token to Escrow and Link to Sale');
    console.log("Info: Adding token to escrow and linking to your Sale (be aware that anyone can do this for your Sale):", TOKEN_ADDRESS);
    const redeemableERC20ClaimEscrow = await rainSDK.RedeemableERC20ClaimEscrow.get(SALE_ADDRESS, TOKEN_ADDRESS, signer);
    console.log('Info: redeemableERC20ClaimEscrow:', redeemableERC20ClaimEscrow);

    console.log(`Info: Connecting to ERC20 token for approval of spend:`, TOKEN_ADDRESS);
    const approveTransaction = await erc20.approve(redeemableERC20ClaimEscrow.address, EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT);
    const approveReceipt = await approveTransaction.wait();
    console.log(`Info: Approve Receipt:`, approveReceipt);
    const depositTransaction = await redeemableERC20ClaimEscrow.deposit( // change to pending deposit if sale is running, need to 'sweep' afterwards to move tokens from pending to deposit
      ethers.utils.parseUnits(EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT.toString(), EXAMPLE_ERC20_DECIMALS)
    );
    const depositReceipt = await depositTransaction.wait();
    console.log('Info: Token Deposit Receipt:', depositReceipt);

    console.log('------------------------------'); // separator

    // todo change raise complete parameters
    // todo explain why close sale isn't needed
    // todo change distributionEndForwardingAddress to an address so the claimers can take only 1 from escrow when making the claim //distributionEndForwardingAddress: "0x0000000000000000000000000000000000000000" // the rTKNs that are not sold get forwarded here (0x00.. will burn them)
    // todo add sdk version to videos

    console.log('### Section 3: Withdrawing Token');
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
