import * as rainSDK from "rain-sdk"; // rain SDK imported using importmap in index.html (or in package.json)
import { ethers } from "ethers"; // ethers library imported using importmap in index.html (or in package.json)
import { connect } from "./connect.js"; // a very basic web3 connection implementation

/**
 * Escrow Example
 * Tutorials (see Getting Started): https://docs.rainprotocol.xyz
 * @returns {Promise<void>}
 */
export async function escrowExample() {

  // todo what are the call exception errors? just a mumbai thing? https://docs.ethers.io/v5/troubleshooting/errors/#help-CALL_EXCEPTION

  // todo maybe warn users they will need to have X matic in their wallet in order to complete ALL the transactions

  // todo you will need to have completed the sale tutorial, purchased an item, and then closed the sale in order to use this example

  try {
    const { address, signer } = await connect(); // get the signer and account address using a very basic connection implementation

    console.log('------------------------------'); // separator

    console.warn("Info: It is important to let your users know how many transactions to expect and what they are. " +
      "This example consists of X Transactions:\n\n"
    );

    console.log('------------------------------'); // separator

    console.warn('Info: BEFORE DOING THIS TUTORIAL, MAKE SURE YOU HAVE CREATED (AND CLOSED) A SALE FROM THE SALE TUTORIAL AND ADDED THE ADDRESS TO: \n`const SALE_ADDRESS`');

    console.log('------------------------------'); // separator

    // constants (can put these into .env)
    // v-- TODO PUT YOUR SALE ADDRESS HERE --v
    const SALE_ADDRESS = "0xbeBFc04050e4afddE68EC2EA5f105690765c1a1E"; // a closed sale from which you own an rTKN
    // ^-- TODO PUT YOUR SALE ADDRESS HERE --^
    const EXAMPLE_ERC20_DECIMALS = 18; // See here for more info: https://docs.openzeppelin.com/contracts/3.x/erc20#a-note-on-decimals

    // using 1 and 1 because there will be only 1 token left in the Sale after completion (in previous tutorial), as the other 99 were burnt
    const EXAMPLE_ERC20_INITIAL_SUPPLY = 1;
    const EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT = 1; // todo is 10 (which the user has from initial supply), causing the insufficient_allowance error?

    // Use case for ensuring users can only claim 1 token
    // a. check the supply of rTKN when a sale is complete
    // b. deposit an amount of erc20 tokens based on that number into an escrow
    // c. users can only claim 1 token each

    // Use case for ensuring users can only claim 1 token (before Sale is complete
    // assign the distributionEndForwardingAddress to the admin so no tokens are burned, this way, the total supply of rTKN is always the same and 1 escrow token is always 1 rTKN

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

    console.log('### Section 1: Mint erc20 Token (Admin function)');
    console.log("Info: Minting new ERC20 with the following state:", emissionsERC20Config);
    const emissionsErc20 = await rainSDK.EmissionsERC20.deploy(signer, emissionsERC20Config);

    // todo claim function will mint another token (in addition to initial supply)

    console.log('Result: emissionsErc20:', emissionsErc20);
    const TOKEN_ADDRESS = emissionsErc20.address;

    console.log('------------------------------'); // separator

    console.log('### Section 2: Add Token to Escrow and Link to Sale (Admin function)');
    console.log("Info: Adding token to escrow and linking to Sale (be aware that anyone can do this for your Sale):", TOKEN_ADDRESS);
    const redeemableERC20ClaimEscrow = await rainSDK.RedeemableERC20ClaimEscrow.get(SALE_ADDRESS, TOKEN_ADDRESS, signer);
    console.log('Info: redeemableERC20ClaimEscrow:', redeemableERC20ClaimEscrow);

    console.log(`Info: Connecting to ERC20 token (${TOKEN_ADDRESS}) for approval of spend of ${EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT}:`, );
    const approveTransaction = await emissionsErc20.approve(
      redeemableERC20ClaimEscrow.address,
      ethers.utils.parseUnits(EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT.toString(), EXAMPLE_ERC20_DECIMALS)
    );
    const approveReceipt = await approveTransaction.wait();
    console.log(`Info: Approve Receipt:`, approveReceipt);

    const depositTransaction = await redeemableERC20ClaimEscrow.deposit( // change to pending deposit if sale is running, need to 'sweep' afterwards to move tokens from pending to deposit
      ethers.utils.parseUnits(EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT.toString(), EXAMPLE_ERC20_DECIMALS)
    );
    const depositReceipt = await depositTransaction.wait();

    console.log('Info: Token Deposit Receipt:', depositReceipt);

    console.log('------------------------------'); // separator

    // todo change raise complete parameters
    // todo change distributionEndForwardingAddress to an address so the claimers can take only 1 from escrow when making the claim //distributionEndForwardingAddress: "0x0000000000000000000000000000000000000000" // the rTKNs that are not sold get forwarded here (0x00.. will burn them)
    // todo add sdk version to videos
    
    // the withdrawer should be the rTKN buyer (holder) of the sale 
    // (from @rouzwelt: my address was a buyer (holder) of the my sale contract so I can perform the withdraw with my wallet as signer, so for this example I think you need to link it with the Sale example,
    // so the signer is the buyer of rTKN and then can perform this example and withdraw from escrow, because if the signer is not a buyer of the sale, then he/she cannot withdraw)
    console.log('### Section 3: Withdrawing Token (User function, i.e. holder of rTKN from Sale)');



    // capturing the current supply of rTKN from the Sale at the time of deposit (just after depositing), to be used when calling the withdraw function
    // (by default this data needs to come from sg query but it is not in the scope of this example)
    const sale = await new rainSDK.Sale(SALE_ADDRESS, signer); // instantiating the Sale contract
    const rTKN = await sale.getRedeemable();  // instantiating the Sale's rTKN contract
    const rTKN_CURRENT_SUPPLY_AT_TIME_OF_DEPOSIT = await rTKN.totalSupply(); // getting the current supply of rTKN // todo tutorial b. will focus on how to change this to use the subgraph

    // {
    //   redeemableEscrowDeposits(where:{iSaleAddress:"0xbeBFc04050e4afddE68EC2EA5f105690765c1a1E", escrowAddress: ESCROW, depositorAddress: DEPOSITOR}) {
    //   id
    //   escrowAddress
    //   redeemable {
    //     id
    //   }
    //   depositor {
    //     id
    //   }
    //   token {
    //     id
    //   }
    //   tokenAddress
    //   tokenAmount
    //   redeemableSupply
    // }
    // }


    console.log(`Info: withdrawing ${TOKEN_ADDRESS} from escrow:`);
    const withdrawTransaction = await redeemableERC20ClaimEscrow.withdraw(
      rTKN_CURRENT_SUPPLY_AT_TIME_OF_DEPOSIT  // each deposit captures the rTKN supply when being submitted on-chain (because the supply of rTKN can change at anytime by holders burning), so when calling withdraw, we need to pass rTKN supply at the time of that specific deposit to be able to perform the withdraw
    );
    console.log(withdrawTransaction);
    const withdrawReceipt = await withdrawTransaction.wait();
    console.log(`Info: receipt for withdrawal (please check your wallet to make sure you have the token, you may need to add the address for the token ${TOKEN_ADDRESS}):`, withdrawReceipt);

    console.log('------------------------------'); // separator

    console.log("Info: Done");
  } catch (err) {
    console.log(err);
  }
}

escrowExample();
