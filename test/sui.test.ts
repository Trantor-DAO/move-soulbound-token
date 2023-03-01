import { describe, it } from 'mocha'
import {mnemonicToSeedHex, Ed25519Keypair, Secp256k1Keypair, RawSigner, JsonRpcProvider, Base64DataBuffer, publicKeyFromSerialized} from '@mysten/sui.js'
import * as secp from '@noble/secp256k1';
import { Signature } from '@noble/secp256k1';
import nacl from 'tweetnacl';

require('dotenv').config()
const TEST_MNEMONICS = process.env.TEST_MNEMONICS
describe('Test sui.js', () => {
  /**
   * doc: https://sui.io/resources-sui/cryptography-in-sui-wallet-specifications/
   */
  it('Test ED25519 sign and verify', async() => {
		if (!TEST_MNEMONICS) {
			throw new Error('lost mnemonics config')
		}
    const keypair_ed25519 = Ed25519Keypair.deriveKeypair(TEST_MNEMONICS, "m/44'/784'/0'/0'/1'");
    const rpcUrl = 'https://fullnode.devnet.sui.io/'
    const provider = new JsonRpcProvider(rpcUrl);
    const signer = new RawSigner( keypair_ed25519, provider );
    const address = await signer.getAddress();
    console.log('address:', '0x'+address)

    const signData = new Base64DataBuffer(
      new TextEncoder().encode('hello world')
    );
    const { signature, pubKey } = await signer.signData(signData)
    console.log('pubKey', pubKey.toString()); // aMvbcOIqpUcJmeByhh3UMPgFpBQEnxqDzE3JBp0VrGs
    console.log('signature', signature.toString());

	  const publicKey = keypair_ed25519.getPublicKey().toString()
	  const SECP256K1_PUBLIC_KEY_SIZE = 33 // Secp256k1PublicKey.js
	  const Ed25519PublicKey_SIZE = 32 // Ed25519PublicKey.js

		const publicKeyData = publicKeyFromSerialized(
			'ED25519',
			publicKey,
		)

	  console.log(publicKeyData.toSuiAddress())

	  const isValid = nacl.sign.detached.verify(
		  signData.getData(),
		  signature.getData(),
		  pubKey.toBytes(),
	  );

		console.log({ isValid })
  })

  it('Test Secp256k1 sign and verify', async() => {
	  if (!TEST_MNEMONICS) {
		  throw new Error('lost mnemonics config')
	  }
    // doc: https://sui.io/resources-sui/cryptography-in-sui-wallet-specifications/
    const keypair_secp256k1 = Secp256k1Keypair.deriveKeypair("m/54'/784'/0'/0/1", TEST_MNEMONICS);
    const rpcUrl = 'https://fullnode.devnet.sui.io/'
    const provider = new JsonRpcProvider(rpcUrl);
    const signer = new RawSigner( keypair_secp256k1, provider );
    const address = await signer.getAddress();
    console.log('address:', '0x'+address)

    const signData = new Base64DataBuffer(
      new TextEncoder().encode('hello world')
    );
    const { signature, pubKey } = await signer.signData(signData)
    console.log('pubKey', pubKey.toString()); // AuvSpk6lx3RsrIf99wbgEpX2XDk0oJQOe0b53l8yBubc
    console.log('signature', signature.toString());

	  const publicKey = keypair_secp256k1.getPublicKey().toString()
	  const publicKeyData = publicKeyFromSerialized(
		  'Secp256k1',
		  publicKey,
	  )

	  const msgHash = await secp.utils.sha256(signData.getData());
	  console.log(publicKeyData.toSuiAddress())

	  const isValid = secp.verify(
		  Signature.fromCompact(signature.getData()),
		  msgHash,
		  pubKey.toBytes(),
	  )

	  console.log({ isValid })
  })

	it('Query package', async() => {
		const rpcUrl = 'https://fullnode.devnet.sui.io/'
		const provider = new JsonRpcProvider(rpcUrl);
		const obj = await provider.getObject('0xf5f3a6b090e7a942a1464269489a16b3c937b51e')
		console.log(obj)
	})
})
