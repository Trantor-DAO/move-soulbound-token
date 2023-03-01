import {Ed25519Keypair, JsonRpcProvider, Network, RawSigner} from '@mysten/sui.js';
import * as fs from 'fs';
import {SuiExecuteTransactionResponse} from "@mysten/sui.js/src/types";
require('dotenv').config()

const TEST_MNEMONICS: string = process.env.TEST_MNEMONICS || ''
let provider = new JsonRpcProvider('https://fullnode.devnet.sui.io/');
const keypair_ed25519 = Ed25519Keypair.deriveKeypair(TEST_MNEMONICS, "m/44'/784'/0'/0'/0'");
const signer = new RawSigner( keypair_ed25519, provider );

const gasBudget = 100000;

interface PackageInfo {
	packageId?: string,
	objectId?: string,
}

async function publish(): Promise<PackageInfo> {
  const compiledModules = [fs.readFileSync('move_packages/sui-sbt/build/SuiSoulboundToken/bytecode_modules/soulboundtoken.mv', {encoding: 'base64'})];
  const publishTxn: SuiExecuteTransactionResponse = await signer.publish({
    compiledModules,
    gasBudget,
  });

  const events = (publishTxn as any)?.effects?.effects?.events
	console.log('publish events', { events })
  const filteredEvents = events.filter((e: any) => {
		return e.newObject !== undefined
  })
	const newObjectEvent = filteredEvents[0]?.newObject;
	if (!newObjectEvent) {
		return {
			packageId: "",
			objectId: "",
		}
	}
  const packageId = newObjectEvent.packageId;
  const objectId = newObjectEvent.objectId;
  return {
	  packageId,
	  objectId,
  }
}

async function main() {
  console.log('----- test publish package -----');
  const addr = await signer.getAddress();
  console.log(`address: 0x${addr}`);

	const publishResult = await publish()
	console.log('published', publishResult)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`error: ${error.stack}`);
    process.exit(1);
  });
