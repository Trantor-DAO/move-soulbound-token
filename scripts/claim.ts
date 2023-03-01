import {Ed25519Keypair, JsonRpcProvider, Network, RawSigner} from '@mysten/sui.js';
require('dotenv').config()

const TEST_MNEMONICS: string = process.env.TEST_MNEMONICS || ''
const moduleName = process.env.MODULE_NAME || 'soulboundtoken'
let provider = new JsonRpcProvider(Network.DEVNET);
const keypair_ed25519 = Ed25519Keypair.deriveKeypair(TEST_MNEMONICS, "m/44'/784'/0'/0'/0'");
const signer = new RawSigner( keypair_ed25519, provider );

const gasBudget = 100000;

interface PackageInfo {
	packageId: string,
	objectId: string,
}

async function mintNftToUsers(medalModuleId: string, medalId: string) {
	const txConfig = {
		packageObjectId: medalModuleId,
		module: moduleName,
		function: 'mint_soulbound_token',
		typeArguments: [],
		arguments: [
			medalId,
			[
				'0x634df09f08a8b58481ecf7bf9f81207c7b6b20d8'
			],
		],
		gasBudget,
	}

  const mintTxn = await signer.executeMoveCall(txConfig);
  console.log('mint NFT', JSON.stringify(mintTxn));
}

async function claimNFT(medalModuleId: string, medalId: string) {
	const claimMedalTxn = await signer.executeMoveCall({
		packageObjectId: medalModuleId,
		module: moduleName,
		function: 'claim_soulbound_token',
		typeArguments: [],
		arguments: [
			medalId,
		],
		gasBudget,
	});
	console.log('mint NFT', JSON.stringify(claimMedalTxn));
}

async function main() {
  console.log('----- test claim NFT -----');
  const addr = await signer.getAddress();
  console.log(`address: 0x${addr}`);

	const publishResult: PackageInfo = {
		"packageId": "0x546798f48f95356db6e1e3c038fa3acbc24b2b9c",
		"objectId": "0x5d1070680158d90e6b733bb94bf6fb8bb0671401"
	}

	const collectionId = '0x20f6b5258cb7121de58e482c6ec84d65bbb4888c'

	// await claimNFT(publishResult.packageId, collectionId)
	await mintNftToUsers(publishResult.packageId, collectionId)

  // const { medalModuleId, medalStoreId } = publishResult;
  // await queries(medalModuleId, medalStoreId, addr);
  // console.log('-----end-----');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`error: ${error.stack}`);
    process.exit(1);
  });
