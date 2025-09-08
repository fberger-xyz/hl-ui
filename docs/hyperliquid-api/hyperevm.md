# HyperEVM Documentation

## Overview
HyperEVM is Hyperliquid's Ethereum Virtual Machine implementation, providing EVM compatibility for smart contracts and DeFi applications on the Hyperliquid chain.

## Network Configuration

### Chain IDs
- **Mainnet**: 999
- **Testnet**: 998

### RPC Endpoints
- **Mainnet**: `https://rpc.hyperliquid.xyz/evm`
- **Testnet**: `https://rpc.hyperliquid-testnet.xyz/evm`

### WebSocket Support
Currently, WebSocket JSON-RPC is not available.

## Technical Specifications

### EVM Version
- **Hardfork**: Cancun (without blob support)
- **EIP-1559**: Enabled
- **Fee Structure**: 
  - Base fees are burned from total EVM supply
  - Priority fees are burned to zero address

### HYPE Token
- **Role**: Native gas token
- **Decimals**: 18
- **Symbol**: HYPE

## Wallet Configuration

### MetaMask Setup
```javascript
// Add HyperEVM to MetaMask
const addNetwork = async () => {
  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: '0x3e7', // 999 in hex for mainnet
      chainName: 'HyperEVM',
      nativeCurrency: {
        name: 'HYPE',
        symbol: 'HYPE',
        decimals: 18
      },
      rpcUrls: ['https://rpc.hyperliquid.xyz/evm'],
      blockExplorerUrls: [] // No official explorer yet
    }]
  });
};
```

### Testnet Configuration
```javascript
// Add HyperEVM Testnet
const addTestnet = async () => {
  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: '0x3e6', // 998 in hex for testnet
      chainName: 'HyperEVM Testnet',
      nativeCurrency: {
        name: 'HYPE',
        symbol: 'HYPE',
        decimals: 18
      },
      rpcUrls: ['https://rpc.hyperliquid-testnet.xyz/evm'],
      blockExplorerUrls: []
    }]
  });
};
```

## Bridging Assets

### Transfer HYPE to HyperEVM
To bridge HYPE from Hyperliquid L1 to HyperEVM:

**Bridge Address**: `0x2222222222222222222222222222222222222222`

```python
# Using Python SDK
from hyperliquid.exchange import Exchange

# Transfer HYPE to HyperEVM
exchange.transfer_to_evm(
    amount="100",  # Amount in HYPE
    destination="0x2222222222222222222222222222222222222222"
)
```

## JSON-RPC Methods

### Standard Ethereum Methods
HyperEVM supports standard Ethereum JSON-RPC methods:

```javascript
// Web3.js example
const Web3 = require('web3');
const web3 = new Web3('https://rpc.hyperliquid.xyz/evm');

// Get latest block
const block = await web3.eth.getBlock('latest');

// Get balance
const balance = await web3.eth.getBalance('0x...');

// Send transaction
const tx = await web3.eth.sendTransaction({
  from: '0x...',
  to: '0x...',
  value: web3.utils.toWei('1', 'ether'),
  gas: 21000
});
```

### Ethers.js Integration
```javascript
import { ethers } from 'ethers';

// Connect to HyperEVM
const provider = new ethers.JsonRpcProvider('https://rpc.hyperliquid.xyz/evm');

// Get network info
const network = await provider.getNetwork();
console.log('Chain ID:', network.chainId); // 999

// Create wallet
const wallet = new ethers.Wallet(privateKey, provider);

// Send transaction
const tx = await wallet.sendTransaction({
  to: '0x...',
  value: ethers.parseEther('1.0')
});
```

## Smart Contract Deployment

### Using Hardhat
```javascript
// hardhat.config.js
module.exports = {
  networks: {
    hyperevm: {
      url: 'https://rpc.hyperliquid.xyz/evm',
      chainId: 999,
      accounts: [process.env.PRIVATE_KEY]
    },
    hyperevmTestnet: {
      url: 'https://rpc.hyperliquid-testnet.xyz/evm',
      chainId: 998,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

### Using Foundry
```bash
# Deploy to HyperEVM mainnet
forge create --rpc-url https://rpc.hyperliquid.xyz/evm \
  --private-key $PRIVATE_KEY \
  src/MyContract.sol:MyContract

# Deploy to testnet
forge create --rpc-url https://rpc.hyperliquid-testnet.xyz/evm \
  --private-key $PRIVATE_KEY \
  src/MyContract.sol:MyContract
```

## Gas Estimation

```javascript
// Estimate gas for transaction
const gasEstimate = await web3.eth.estimateGas({
  from: '0x...',
  to: '0x...',
  value: web3.utils.toWei('1', 'ether')
});

// Get current gas price
const gasPrice = await web3.eth.getGasPrice();

// EIP-1559 gas parameters
const block = await web3.eth.getBlock('latest');
const baseFee = block.baseFeePerGas;
const maxPriorityFee = web3.utils.toWei('2', 'gwei');
const maxFee = baseFee + maxPriorityFee;
```

## Rate Limits

- **JSON-RPC Requests**: 100 per minute per IP

## Development Considerations

### Current Limitations
1. No WebSocket support
2. No official block explorer
3. No official frontend components
4. Limited tooling ecosystem

### Best Practices
1. **Gas Management**
   - Monitor base fee fluctuations
   - Use EIP-1559 transaction format
   - Implement gas price strategies

2. **Error Handling**
   ```javascript
   try {
     const tx = await contract.method();
     await tx.wait();
   } catch (error) {
     if (error.code === 'INSUFFICIENT_FUNDS') {
       console.error('Not enough HYPE for gas');
     }
   }
   ```

3. **Network Monitoring**
   ```javascript
   // Check network status
   const isConnected = await web3.eth.net.isListening();
   const peerCount = await web3.eth.net.getPeerCount();
   const chainId = await web3.eth.getChainId();
   ```

## Example: Complete Integration

```javascript
import { ethers } from 'ethers';

class HyperEVMClient {
  constructor(rpcUrl, privateKey) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }
  
  async getBalance(address) {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }
  
  async sendHYPE(to, amount) {
    const tx = await this.wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount)
    });
    
    console.log('Transaction hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.transactionHash);
    
    return receipt;
  }
  
  async deployContract(abi, bytecode, ...args) {
    const factory = new ethers.ContractFactory(abi, bytecode, this.wallet);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    
    console.log('Contract deployed at:', await contract.getAddress());
    return contract;
  }
}

// Usage
const client = new HyperEVMClient(
  'https://rpc.hyperliquid.xyz/evm',
  process.env.PRIVATE_KEY
);

// Check balance
const balance = await client.getBalance('0x...');
console.log('Balance:', balance, 'HYPE');
```

## Future Development

As HyperEVM is actively developed, expect:
- WebSocket support
- Official block explorer
- Enhanced tooling
- More DeFi protocols
- Cross-chain bridges

Stay updated with the latest developments through official Hyperliquid channels.