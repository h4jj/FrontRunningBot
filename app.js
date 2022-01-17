const ethers = require("ethers");
const env = require("./env.json");
const tokens = require("./tokens.js")
const pcsAbi = new ethers.utils.Interface(require("./abi.json"));
const retry = require("async-retry");

Object.assign(process.env, env)

let provider;

const startConn = () => {
    provider = new ethers.providers.WebSocketProvider(process.env.WS_SPEEDY_NODE);
    
    provider.on("pending", async (txHash) => {

        provider
            .getTransaction(txHash)
            .then((tx) => {
                if(tx && tx.to) {
                    if(tx.to == tokens.router) {
                        const re1 = new RegExp("^0xf305d719");
                        if(re1.test(tx.data)) {
                            const decodedInput = pcsAbi.parseTransaction({
                                data: tx.data,
                                value: tx.value
                            });

                            await buyToken(tx)
                        }
                    }
                }
            })
            .catch((err) => console.log(err))
    })
}

const buyToken = async (txLP) => {
    const tx = await retry(
      async () => {
        const amountOutMin = 0; // I don't like this but it works
        let buyConfirmation = await router.swapExactETHForTokens(
          amountOutMin,
          tokens.pair,
          process.env.RECIPIENT,
          Date.now() + 1000 * tokens.deadline,
          {
            value: purchaseAmount,
            gasLimit: tokens.gasLimit,
            gasPrice: txLP.gasPrice,
          }
        );
        return buyConfirmation;
      },
      {
        retries: tokens.buyRetries,
        minTimeout: tokens.retryMinTimeout,
        maxTimeout: tokens.retryMaxTimeout,
        onRetry: (err, number) => {
          console.log("Buy Failed - Retrying", number);
          console.log("Error", err);
          if (number === tokens.buyRetries) {
            console.log("Sniping has failed...");
            process.exit();
          }
        },
      }
    );
    console.log("Associated LP Event txHash: " + txLP.hash);
    console.log("Your [pending] txHash: " + tx.hash);
    process.exit();
  };
  
startConn();