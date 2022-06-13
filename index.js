import { ethers, BigNumber } from "ethers";

export async function example() {
  const CHAIN_ID = 80001; // Polygon Mumbai Testnet
  
  try {
    const {ethereum} = window;

    if (!ethereum) {
      console.log("No Web3 Wallet installed");
    }

    const provider = new ethers.providers.Web3Provider(ethereum, {
      name: 'Mumbai',
      chainId: CHAIN_ID,
    });

    // Prompt user for account connections (please note this is very bare bones)
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const address = await signer.getAddress(); // your wallet address
    console.log(`Signer:`, signer);
    console.log(`Address: ${address}`);
    
    // *** Code Goes Here ***
    
  } catch (err) {
    console.log(err);
  }
}

example();
