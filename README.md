# SoulboundTokenNFT Contract in SUI Move

This is a smart contract written in the Move programming language for the SUI ecosystem that implements a SoulboundTokenNFT. The contract allows users to create, transfer, and soulbind unique SoulboundTokenNFTs.

## How to Use

### Prerequisites

To use this smart contract, you will need the following:
- Install the [prerequisites](https://docs.sui.io/build/install#prerequisites) and tools you need to work with Sui.
- Install the [Sui binaries](https://docs.sui.io/build/install#install-or-update-sui-binarie).

### Installation

To install this smart contract, follow these steps:

1. Clone the repository to your local machine.
2. Compile the contract `sui move build`
3. Test the contract `sui move test`
4. To publish the Move package, navigate to the project directory and execute `./bin/publish.sh`


### Example Usage

Here's an example of how to use this smart contract:

1. Create a new SoulboundToken Collection by calling the `create_soulbound_token` function and passing arguments.
2. To mint a new Soulbound Token NFT, you can call the `mint_soulbound_token` method and pass in the collection information and the addresses that will mint the NFT.
3. To add a user's address to the whitelist during collection creation, you can pass the address as an argument when creating the collection. To claim a Soulbound Token NFT as a whitelisted user, you can call the `claim_soulbound_token` method to claim.


Contributing
We welcome contributions to this project. To contribute, please fork the repository, make your changes, and submit a pull request.

License
This project is licensed under the MIT License - see the LICENSE file for details.

Acknowledgments
The Move programming language and the SUI ecosystem.
The Move language documentation.
