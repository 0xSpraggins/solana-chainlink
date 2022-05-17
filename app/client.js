// Parse Arguments for program and feed
const args = require('minimist')(process.argv.slice(2));

// Initialize Anchor and provider
const anchor = require("@project-serum/anchor");
const { collapseTextChangeRangesAcrossMultipleVersions } = require('typescript');
const provider = anchor.AnchorProvider.env();

anchor.setProvider(provider);

const CHAINLINK_PROGRAM_ID = "CaH12fwNTKJAG8PxEvo9R96Zc2j8qNHZaFj8ZW49yZNT";
const DIVISOR = 100000000;

//Datafeed account address for SOL / USD
const default_feed = "EdWr4ww1Dq82vPe8GFjjcVPo2Qno3Nhn6baCgM3dCy28";
const CHAINLINK_FEED = args['feed'] || default_feed;

async function main() {

    // Read in the IDL
    const idl = JSON.parse(
        require("fs").readFileSync("../target/idl/solana_chainlink.json", "utf8")
    );

    // Address of the deployed program
    const programId = new anchor.web3.PublicKey(args['program']);

    //Generate the client from the IDL
    const program = new anchor.Program(idl, programId);

    // Create an account to store the price feed data
    const priceFeedAccount = anchor.web3.Keypair.generate();


    console.log('priceFeeedAccount public key: ' +
    priceFeedAccount.publicKey);
    console.log('user public key: ' + provider.wallet.publicKey);

    //Execute the RPC
    let tx = await program.rpc.execute({
        accounts: {
          decimal: priceFeedAccount.publicKey,
          user: provider.wallet.publicKey,
          chainlinkFeed: CHAINLINK_FEED,
          chainlinkProgram: CHAINLINK_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId
        },
        options: { commitment: "confirmed" }, //start with the most recent block that's confirmed
        signers: [priceFeedAccount],
      });

    // tx.signers([priceFeedAccount]);


    console.log("Transaction rpc {}", tx);


    console.log("Fetching transaction logs...");
    let t = await provider.connection.getTransaction(tx, {commitment: "confirmed"});

    console.log(t.meta.logMessages);

    // Fetch the account details of the account containing the price data
    const latestPrice = await program.account.decimal.fetch(priceFeedAccount.publicKey);

    console.log("price is: " + latestPrice.value / DIVISOR)
}

console.log("Running client...");
main().then(() => console.log("Success"));