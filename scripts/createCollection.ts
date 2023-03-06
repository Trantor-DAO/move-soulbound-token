import { Ed25519Keypair, JsonRpcProvider, Network, RawSigner } from '@mysten/sui.js';
require('dotenv').config()

const TEST_MNEMONICS: string = process.env.TEST_MNEMONICS || ''
let provider = new JsonRpcProvider(process.env.SUI_RPC_URL);
const isDevNet = process.env.SUI_RPC_URL!.indexOf('devnet') !== -1
if (isDevNet) {
  provider = new JsonRpcProvider(Network.DEVNET);
}
const keypair_ed25519 = Ed25519Keypair.deriveKeypair(TEST_MNEMONICS, "m/44'/784'/0'/0'/0'");
const signer = new RawSigner( keypair_ed25519, provider );

const gasBudget = 100000;

interface PackageInfo {
	packageId: string,
	objectId: string,
}

const moduleName = 'soulboundtoken'
async function createCollection(params: PackageInfo) {
  const { packageId, objectId } = params;
  const createMedalTxn = await signer.executeMoveCall({
    packageObjectId: packageId,
    module: moduleName,
    function: 'create_soulbound_token',
    typeArguments: [],
    arguments: [
	    objectId,
      'Sui Builder',
      'Sui is a boundless platform to build rich and dynamic on-chain assets from gaming to finance.',
      '10000',
      [],
      'https://dldv97d8qer48.cloudfront.net/web/images/tmp/sui-builder.jpg',
    ],
    gasBudget,
  });

	const events = (createMedalTxn as any)?.effects?.effects?.events
	const filteredEvents = events.filter((e: any) => {
		return e.newObject?.objectType === `${packageId}::${moduleName}::CollectionSchema`
	})

	return filteredEvents[0]?.newObject.objectId;
}

async function main() {
  console.log('----- test create collection -----');
  const addr = await signer.getAddress();
  console.log(`address: 0x${addr}`);

	const publishResult: PackageInfo = {
		"packageId": "0x546798f48f95356db6e1e3c038fa3acbc24b2b9c",
		"objectId": "0x5d1070680158d90e6b733bb94bf6fb8bb0671401"
	}

  const collectionId = await createCollection(publishResult);
	console.log('create collection:', collectionId)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`error: ${error.stack}`);
    process.exit(1);
  });
