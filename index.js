import * as rainSDK from 'rain-sdk'; // rain SDK imported using importmap in index.html (or in package.json)
import { ethers } from 'ethers'; // ethers library imported using importmap in index.html (or in package.json)
import { connect } from './connect.js'; // a very basic web3 connection implementation
import { logToWindow } from '@unegma/utils';
logToWindow('console'); // override console.log to output to browser with very simple styling (be aware, this prevents pushing multiple messages in one .log())

const CHAIN_DATA = {
  name: 'Mumbai',
  chainId: 80001 // Mumbai testnet chain id
}
const SUBGRAPH_ENDPOINT = rainSDK.AddressBook.getSubgraphEndpoint(CHAIN_DATA.chainId);

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
    console.log('> # Escrow Example', 'black', 'bold');
    console.log('> Info: (check your console for more data and make sure you have a browser wallet installed and connected to Polygon Mumbai testnet)', 'orange');
    const { address, signer } = await connect(CHAIN_DATA); // get the signer and account address using a very basic connection implementation

    console.log('> ## Transactions', 'orange', 'bold');
    console.log('> Info: It is important to let your users know how many transactions to expect and what they are.', 'orange');
    console.log('> This example consists of x Transactions:', 'orange');

    console.log('------------------------------'); // separator

    console.log('> Info: BEFORE DOING THIS TUTORIAL, MAKE SURE YOU HAVE CREATED (AND CLOSED) A SALE FROM THE SALE TUTORIAL AND ADDED THE ADDRESS TO: `SALE_ADDRESS`', 'red', 'bold');

    console.log('------------------------------'); // separator

    // constants (can put these into .env)

    // v-- TODO PUT YOUR SALE ADDRESS FROM PREVIOUS TUTORIAL HERE --v
    const SALE_ADDRESS = "0xbeBFc04050e4afddE68EC2EA5f105690765c1a1E"; // a closed sale from which you own an rTKN
    // ^-- TODO PUT YOUR SALE ADDRESS FROM PREVIOUS TUTORIAL HERE --^
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

    console.log('> ## Section 1 (Admin function): Mint erc20 Token for adding to an Escrow connected to the Sale', 'black', 'bold');
    console.log('> Info: Deploying new ERC20 with the following state:')
    console.log(emissionsERC20Config, 'blue');
    const emissionsErc20 = await rainSDK.EmissionsERC20.deploy(signer, emissionsERC20Config);
    // todo claim function will mint another token (in addition to initial supply)??
    const emissionsErc20Address = emissionsErc20.address;
    console.log(`> Result: deployed emissionsErc20, with address ${emissionsErc20Address}, and sent you: ${EXAMPLE_ERC20_INITIAL_SUPPLY} Tokens`, 'green')
    console.log(emissionsErc20); // todo check what exists in addition to what is on an erc20, are erc20s through the evm 'factory'?
    console.log('> Info: to see the tokens in your Wallet, add a new token with the address above.', 'red', 'bold');

    console.log('------------------------------'); // separator

    console.log('> ## Section 2 (Admin function): Add Token to Escrow and Link to Sale', 'black', 'bold');
    console.log(`> Info: Adding Token (${emissionsErc20Address}) to Escrow and linking to Sale (${SALE_ADDRESS}).`);
    console.log('> Info: be aware that, due to the open nature of blockchains, anyone can create an Escrow for any Sale.', 'orange');
    const redeemableERC20ClaimEscrow = await rainSDK.RedeemableERC20ClaimEscrow.get(SALE_ADDRESS, emissionsErc20Address, signer);
    const escrowAddress = redeemableERC20ClaimEscrow.address;
    console.log(`> Result: initialised redeemableERC20ClaimEscrow, with address ${escrowAddress}`, 'green');
    console.log(redeemableERC20ClaimEscrow);
    console.log(`> Info: Connecting to ${emissionsERC20Config.erc20Config.name} ERC20 token (${emissionsErc20Address}) for approval of spend of ${EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT} ${emissionsERC20Config.erc20Config.symbol}`);
    const approveTransaction = await emissionsErc20.approve(
      redeemableERC20ClaimEscrow.address,
      ethers.utils.parseUnits(EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT.toString(), EXAMPLE_ERC20_DECIMALS)
    );
    const approveReceipt = await approveTransaction.wait();
    console.info(approveReceipt);
    console.log(`> Info: depositing token into Escrow:`);
    console.log(escrowAddress, 'blue');
    const depositTransaction = await redeemableERC20ClaimEscrow.deposit( // change to pending deposit if sale is running, need to 'sweep' afterwards to move tokens from pending to deposit
      ethers.utils.parseUnits(EXAMPLE_ERC20_AMOUNT_TO_DEPOSIT.toString(), EXAMPLE_ERC20_DECIMALS)
    );
    const depositReceipt = await depositTransaction.wait();

    console.log('> Result: Deposit complete.', 'green');
    console.info(depositReceipt);

    console.log('------------------------------'); // separator

    console.log('> Info: Waiting 1 minute to let subgraph index data...', 'red');
    // wait for 1 minute so that subgraph has time to index
    await new Promise(resolve => setTimeout(resolve, 60000));

    console.log('------------------------------'); // separator

    // todo change raise complete parameters
    // todo change distributionEndForwardingAddress to an address so the claimers can take only 1 from escrow when making the claim //distributionEndForwardingAddress: "0x0000000000000000000000000000000000000000" // the rTKNs that are not sold get forwarded here (0x00.. will burn them)
    // todo add sdk version to videos
    
    // the withdrawer should be the rTKN buyer (holder) of the sale 
    // (from @rouzwelt: my address was a buyer (holder) of the my sale contract so I can perform the withdraw with my wallet as signer, so for this example I think you need to link it with the Sale example,
    // so the signer is the buyer of rTKN and then can perform this example and withdraw from escrow, because if the signer is not a buyer of the sale, then he/she cannot withdraw)
    console.log(`> ## Section 3 (User function): Withdrawing ${emissionsERC20Config.erc20Config.symbol} Token for User, i.e. holder of redeemable Tokens (rTKN) from Sale)`, 'black', 'bold');

    // capturing the current supply of rTKN from the Sale at the time of deposit (just after depositing), to be used when calling the withdraw function
    // (by default this data needs to come from sg query but it is not in the scope of this example)
    const sale = await new rainSDK.Sale(SALE_ADDRESS, signer); // instantiating the Sale contract
    const rTKN = await sale.getRedeemable();  // instantiating the Sale's rTKN contract
    const totalRTKNSupplyAtTimeOfDeposit = await rTKN.totalSupply(); // getting the current supply of rTKN // todo tutorial b. will focus on how to change this to use the subgraph

    // todo check if token address can be one of the query inputs
    // todo DOES IT NEED TIME TO ADD THE TOKEN EVENT TO THE SUBGRAPH?? (NOTHING COMING UP WHEN PASSING IN emissionsErc20Address)
    // todo--question what is the difference between tokenAmount and redeemableSupply?
    console.log('> Info: fetching deposit data from Subgraph with endpoint:');
    console.log(SUBGRAPH_ENDPOINT, 'blue');
    // depositorAddress are the same in this example as we are using the same wallet for everything
    let subgraphData = await fetch(SUBGRAPH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            redeemableEscrowDeposits(where: 
              {iSaleAddress:"${SALE_ADDRESS}", escrowAddress: "${escrowAddress}", depositorAddress: "${address}", tokenAddress: "${emissionsErc20Address}"}
            ) {
              id
              token {
                id
                decimals
                name
                symbol
              }
              tokenAmount
              redeemableSupply
            }
          }
        `
      })
    });

    // the response will then come back as promise, the data of which will need to be accessed as such:
    subgraphData = await subgraphData.json();
    subgraphData = subgraphData.data.redeemableEscrowDeposits[0]; // should only be one here anyway. // todo--question is there potential for 'too quick' to cause it not to exist yet in the subgraph?
    if (subgraphData === undefined) throw new Error('NO_SUBGRAPH_DATA');

    console.log(`> Result: data from subgraph with endpoint ${SUBGRAPH_ENDPOINT}:`);
    console.log(subgraphData, 'blue');

    // todo add data about what the token is and how much
    console.log(`> Info: withdrawing ${emissionsERC20Config.erc20Config.symbol} from Escrow for User, (amount received will be based on User's holdings of ${subgraphData.token.symbol} at the time the ${emissionsERC20Config.erc20Config.symbol} deposit happened):`);

    // without subgraph, so potentially inaccurate:
    // const withdrawTransaction = await redeemableERC20ClaimEscrow.withdraw(
    //   totalRTKNSupplyAtTimeOfDeposit  // each deposit captures the rTKN supply when being submitted on-chain (because the supply of rTKN can change at anytime by holders burning), so when calling withdraw, we need to pass rTKN supply at the time of that specific deposit to be able to perform the withdraw
    // );
    //
    // console.log(`Info: Amount of rTKN called directly from contract (don't use this): ${totalRTKNSupplyAtTimeOfDeposit} vs subgraphData.redeemableSupply: ${subgraphData.redeemableSupply} vs subgraphData.tokenAmount: ${subgraphData.tokenAmount}`); // useful for debugging/seeing stats

    // with subgraph, redeemableSupply is available in the data of the deposit event:
    const withdrawTransaction = await redeemableERC20ClaimEscrow.withdraw(
      subgraphData.redeemableSupply // each deposit captures the rTKN supply when being submitted on-chain (because the supply of rTKN can change at anytime by holders burning), so when calling withdraw, we need to pass rTKN supply at the time of that specific deposit to be able to perform the withdraw
    );
    console.info(withdrawTransaction);
    const withdrawReceipt = await withdrawTransaction.wait();
    console.log(`> Result: withdrawal complete (please check your wallet to make sure you have the token, you may need to add the address for the token ${emissionsErc20Address}):`, 'green');
    console.info(withdrawReceipt);

    console.log('------------------------------'); // separator

    console.log('> Info: Completed Successfully');
  } catch (err) {
    console.log('------------------------------'); // separator
    console.log(`> Error: ${err.message}`, 'red', 'bold');
    console.warn(err);
  }
}

escrowExample();
