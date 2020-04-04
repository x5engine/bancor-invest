import React, { useState } from 'react';

// eslint-disable-next-line no-unused-vars
import { useWeb3Network, useEphemeralKey, useWeb3Injected } from '@openzeppelin/network/react';

import Web3Info from './components/Web3Info/index.js';
import Counter from './components/Counter/index.js';

import styles from './App.module.scss';

// import bancor from 'bancor-sdk';
import { ContractRegistry } from './contracts/ContractRegistry';
import { BancorConverterRegistry } from './contracts/BancorConverterRegistry';

// eslint-disable-next-line no-unused-vars
const infuraToken = process.env.REACT_APP_INFURA_TOKEN || '95202223388e49f48b423ea50a70e336';

function App() {
  // get ephemeralKey
  // eslint-disable-next-line no-unused-vars
  const signKey = useEphemeralKey();

  // get GSN web3
  const context = useWeb3Network(`wss://ropsten.infura.io/ws/v3/${infuraToken}`, {
    pollInterval: 15 * 1000,
    gsn: {
      signKey,
    },
  });

  // const context = useWeb3Network('http://127.0.0.1:8545', {
  //   gsn: {
  //     dev: true,
  //     signKey,
  //   },
  // });

  // load Counter json artifact
  let counterJSON = undefined;
  try {
    // see https://github.com/OpenZeppelin/solidity-loader
    counterJSON = require('../../contracts/Counter.sol');
  } catch (e) {
    console.log(e);
  }

  // load Counter instance
  const [counterInstance, setCounterInstance] = useState(undefined);
  let deployedNetwork = undefined;
  if (!counterInstance && context && counterJSON && counterJSON.networks && context.networkId) {
    deployedNetwork = counterJSON.networks[context.networkId.toString()];
    if (deployedNetwork) {
      setCounterInstance(new context.lib.eth.Contract(counterJSON.abi, deployedNetwork.address));
    }
  }

  // load bancor registry on Ropsten
  const init = async () => {
    let contractRegistryContract = new context.lib.eth.Contract(ContractRegistry, '0xFD95E724962fCfC269010A0c6700Aa09D5de3074');
    let registryBlockchainId = await contractRegistryContract.methods.addressOf(context.lib.utils.asciiToHex('BancorConverterRegistry')).call();
    console.log(registryBlockchainId);
    let registry = new context.lib.eth.Contract(BancorConverterRegistry, registryBlockchainId);
    let smartTokenCount = await registry.methods.getSmartTokenCount().call();
    let smartTokens = await registry.methods.getSmartTokens().call();
    console.log(smartTokenCount);
    console.log(smartTokens);
  }
  init();

  function renderNoWeb3() {
    return (
      <div className={styles.loader}>
        <h3>Web3 Provider Not Found</h3>
        <p>Please, install and run Ganache.</p>
      </div>
    );
  }

  return (
    <div className={styles.App}>
      <div className={styles.wrapper}>
        {!context.lib && renderNoWeb3()}
        <div className={styles.contracts}>
          <h1>Bancor Invest</h1>
          <div className={styles.widgets}>
            <Web3Info title="Web3 Provider" context={context} />
            <Counter {...context} JSON={counterJSON} instance={counterInstance} deployedNetwork={deployedNetwork} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
