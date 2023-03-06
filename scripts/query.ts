import {Ed25519Keypair, JsonRpcProvider, Network, RawSigner} from '@mysten/sui.js';
import * as fs from 'fs';
import {SuiExecuteTransactionResponse} from "@mysten/sui.js/src/types";
require('dotenv').config()

const TEST_MNEMONICS: string = process.env.TEST_MNEMONICS || ''
let provider = new JsonRpcProvider(process.env.SUI_RPC_URL);
const isDevNet = process.env.SUI_RPC_URL!.indexOf('devnet') !== -1
if (isDevNet) {
  provider = new JsonRpcProvider(Network.DEVNET);
}
const keypair_ed25519 = Ed25519Keypair.deriveKeypair(TEST_MNEMONICS, "m/44'/784'/0'/0'/0'");
const signer = new RawSigner( keypair_ed25519, provider );

interface PackageInfo {
	packageId: string,
	objectId: string,
}

const moduleName = process.env.MODULE_NAME || 'soulboundtoken2'

async function queries(packageObjectId: string, collectionId: string, userAddr: string) {
	const medalStore = await provider.getObject(collectionId);
	const medalsTableID = (medalStore as any).details.data?.fields.owners.fields.id.id;
	if (!medalsTableID) {
		return
	}

	const medals = await provider.getObjectsOwnedByObject(medalsTableID);
	// console.log(`medals: ${JSON.stringify(medals, null, 2)}`);
	// query medal details, this data can be cached by frontend
	// const cachedMedalDetails: any = {};
	// for (const medal of medals) {
	// 	const medalIdDetail = await provider.getObject(medal.objectId);
	// 	console.log(`medalIdDetail: ${JSON.stringify(medalIdDetail, null, 2)}`);
	// 	const medalId = (medalIdDetail as any).details.data.fields.value;
	// 	const medalDetail = await provider.getObject(medalId);
	// 	console.log(`medalDetail: ${JSON.stringify(medalDetail, null, 2)}`);
	// 	cachedMedalDetails[medalId] = (medalDetail.details as any).data.fields;
	// }
	// // query user medal gallery
	const userObjects = await provider.getObjectsOwnedByAddress(userAddr)
	const matchType = `${packageObjectId}::${moduleName}::SoulboundTokenSchema`
	console.log({ matchType })
	const userNfts = userObjects.filter(obj => obj.type === matchType);
	console.log({ userNfts })
	// console.log(`userMedals: ${JSON.stringify(userMedals, null, 2)}`);
	// console.log(`cachedMedalDetails: ${JSON.stringify(cachedMedalDetails, null, 2)}`);
	// for (const medal of userMedals) {
	// 	const personalMedal = await provider.getObject(medal.objectId);
	// 	console.log(`personalMedal: ${JSON.stringify(personalMedal, null, 2)}`);
	// 	const medalDetail = cachedMedalDetails[(personalMedal as any).details.data.fields.medal];
	// 	console.log(`userMedalDetail: ${JSON.stringify(medalDetail, null, 2)}`);
	// }
}

async function main() {
  console.log('----- test query NFT -----');
  const addr = await signer.getAddress();
  console.log(`address: 0x${addr}`);

	const publishResult: PackageInfo = {
		"packageId": "0xb071f5bb4166ee064891f0226f1740777d07529d",
		"objectId": "0x21c1511e1262972bd385d4c93fd575606c98c088"
	}

	const collectionId = '0xa97861dce3feaceea60174d2a960588e362fe922'
	await queries(publishResult.packageId, collectionId, addr)

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
