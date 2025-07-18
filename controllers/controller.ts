import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { tokenMintAddress, amount } from '../utils/constants.js';
import fs from 'fs';

const secret = JSON.parse(fs.readFileSync('./secret.json', 'utf-8'));

export async function transferSplToken(recipientAddress: string) {
  try {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const sender = Keypair.fromSecretKey(Uint8Array.from(secret));
    const recipient = new PublicKey(recipientAddress);
    const mint = new PublicKey(tokenMintAddress);

    // Get or create associated token accounts
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      sender,
      mint,
      sender.publicKey
    );

    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      sender,
      mint,
      recipient
    );

    // Transfer tokens
    const txSignature = await transfer(
      connection,
      sender,
      senderTokenAccount.address,
      recipientTokenAccount.address,
      sender.publicKey,
      amount,
    );

    console.log('✅ Transfer successful. Tx Signature:', txSignature);
  } catch (error) {
    console.error('❌ Transfer failed:', error);
  }
}
