const decimals = 18;

function formatHex0(value, tokenDecimals) {
  const formattedValue = Big(value.toString())
    .div(Big(10).pow(tokenDecimals))
    .toFixed(0)
    .replace(/\d(?=(\d{3})+\.)/g, "$&,");

  return formattedValue;
}

function formatHex(value, tokenDecimals) {
  const formattedValue = Big(value.toString())
    .div(Big(10).pow(tokenDecimals))
    .toFixed(6)
    .replace(/\d(?=(\d{3})+\.)/g, "$&,");

  return formattedValue;
}

State.init({
  strEther: 0,
  gasPrice: 0,
});

// connect to Base to show UI
if (
  state.chainId === undefined &&
  ethers !== undefined &&
  Ethers.send("eth_requestAccounts", [])[0]
) {
  Ethers.provider()
    .getNetwork()
    .then((chainIdData) => {
      if (chainIdData?.chainId) {
        State.update({ chainId: chainIdData.chainId });
      }
    });
}

if (state.chainId !== undefined && state.chainId !== 8453) {
  return <p>Switch to Base Mainnet</p>;
}

// FETCH ABI

const contractAddress = "0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4";
const tokenDecimals = 18;

const contractAbi = fetch(
  "https://raw.githubusercontent.com/aeither/bos-gateway/main/abi/FriendtechSharesV1.json"
);
if (!contractAbi.ok) {
  return "Loading";
}

const iface = new ethers.utils.Interface(contractAbi.body);

// HELPER

function getGasPrice() {
  return Ethers.provider().getGasPrice();
}

// DETECT SENDER

if (state.sender === undefined) {
  const accounts = Ethers.send("eth_requestAccounts", []);
  if (accounts.length) {
    State.update({ sender: accounts[0] });
    console.log("set sender", accounts[0]);
  }
}

// FETCH SENDER BALANCE

if (state.balance === undefined && state.sender) {
  Ethers.provider()
    .getBalance(state.sender)
    .then((balance) => {
      State.update({ balance: Big(balance).div(Big(10).pow(18)).toFixed(2) });
    });
}

const appContainer = styled.div`
  background-color: #000;
  color: #fff;
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 10px;
  max-width: 600px;
  margin: 0 auto;
`;

// UI

const getSender = () => {
  return !state.sender
    ? ""
    : state.sender.substring(0, 6) +
        "..." +
        state.sender.substring(state.sender.length - 4, state.sender.length);
};

return (
  <appContainer>
    <div class="border-bottom">
      <div class="container px-1 py-2">
        <div class="row">
          <div class="col">
            <div className="d-flex justify-content-between align-items-right">
              <h1>friend.tech</h1>
              <Web3Connect connectLabel="Wallet" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <Widget
      src="scottie.near/widget/Prices"
      //props={{
      //blockHeight: message.block_height,
      //}}
    />

    {!!state.sender && (
      <div class="container centered-text">
        <div class="row">
          <div class="col">
            <div class="border rounded py-2 my-2 text-center">
              {state.balance} ETH - {getSender()}
            </div>
          </div>
        </div>
      </div>
    )}

    <div class="container centered-text mt-5">
      <h5>The friend.tech Account Explorer 🔍</h5>
      <div class="row">
        <div class="col py-2">
          <div class="input-group">
            <input
              disabled={!state.sender}
              value={state.targetAddress}
              onChange={(e) => State.update({ targetAddress: e.target.value })}
              placeholder="Search by Address"
            />
            <button
              onClick={() => {
                const friendTechContract = new ethers.Contract(
                  contractAddress,
                  contractAbi.body,
                  Ethers.provider().getSigner()
                );

                // Total supply
                friendTechContract
                  .sharesSupply(state.targetAddress)
                  .then((data) => {
                    console.log(formatHex(data, 0));
                    State.update({ sharesSupply: formatHex0(data, 0) });
                  });

                // Sell Price
                friendTechContract
                  .getSellPrice(state.targetAddress, 1)
                  .then((data) => {
                    console.log(formatHex(data, decimals));
                    State.update({ sellPrice: formatHex(data, decimals) });
                  });

                // Sell Price After Fee
                friendTechContract
                  .getSellPriceAfterFee(state.targetAddress, 1)
                  .then((data) => {
                    console.log(formatHex(data, decimals));
                    State.update({
                      sellPriceAfterFee: formatHex(data, decimals),
                    });
                  });

                // Buy Price
                friendTechContract
                  .getBuyPrice(state.targetAddress, 1)
                  .then((data) => {
                    console.log(formatHex(data, decimals));
                    State.update({ buyPrice: formatHex(data, decimals) });
                  });

                // Buy Price After Fee
                friendTechContract
                  .getBuyPriceAfterFee(state.targetAddress, 1)
                  .then((data) => {
                    console.log(formatHex(data, decimals));
                    State.update({
                      buyPriceAfterFee: formatHex(data, decimals),
                    });
                  });

                // target user balance
                Ethers.provider()
                  .getBalance(state.targetAddress)
                  .then((balance) => {
                    console.log("balance", formatHex(balance, decimals));
                    State.update({
                      targetBalance: formatHex(balance, decimals),
                    });
                  });
              }}
              className="btn btn-primary"
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </div>

    {state.targetAddress && state.sharesSupply && (
      <>
        <div class="container centered-text">
          <div class="row ">
            <div class="col ">
              <div class="border rounded py-2 my-2">
                <div class="px-2">Supply: {state.sharesSupply}</div>
                <div class="px-2">Buy Price: {state.buyPrice}</div>
                <div class="px-2">
                  Buy Price (including fees): {state.buyPriceAfterFee}{" "}
                </div>
                <div class="px-2">Sell Price: {state.sellPrice}</div>
                <div class="px-2">
                  Sell Price (including fees): {state.sellPriceAfterFee}
                </div>
                <div class="px-2">Address Balance: {state.targetBalance}</div>
              </div>
            </div>
          </div>
        </div>
      </>
    )}

    <div class="container centered-text">
      <h5>Top 3 accounts</h5>
      <div class="row">
        <div class="col m-2">1. Racer - 0xfd72...325a9</div>
        <div class="col">
          <button
            onClick={() => {
              clipboard.writeText("0xfd7232e66a69e1ae01e1e0ea8fab4776e2d325a9");
            }}
          >
            Copy
          </button>
        </div>
      </div>
      <div class="row">
        <div class="col m-2">2. Hsaka - 0xef42...7a226</div>
        <div class="col">
          <button
            onClick={() => {
              clipboard.writeText("0xef42b587e4a3d33f88fa499be1d80c676ff7a226");
            }}
          >
            Copy
          </button>
        </div>
      </div>
      <div class="row">
        <div class="col m-2">3. Cobie - 0x4e5f...676e1</div>
        <div class="col">
          <button
            onClick={() => {
              clipboard.writeText("	0x4e5f7e4a774bd30b9bdca7eb84ce3681a71676e1");
            }}
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  </appContainer>
);
