import algosdk from 'algosdk';
import TxnVerifer from './txnVerify.mjs';
let verifier = new TxnVerifer();

testTxns();

async function testTxns(){
  var account = algosdk.generateAccount();
  var passphrase = algosdk.secretKeyToMnemonic(account.sk);
  
  const indexerServer = 'http://testnet-idx.algonode.network';

  const token = '';
  const algodServer = 'https://testnet-api.algonode.cloud';
  const port = 443;
  const algodClient = new algosdk.Algodv2(token, algodServer, port);
  
  let myAccount = algosdk.mnemonicToSecretKey(passphrase);
  
  let params = await algodClient.getTransactionParams().do();
  const receiver = "GD64YIY3TWGDMCNPP553DZPPR6LDUSFQOIJVFDPPXWEG3FVOJCCDBBHU5A";
  const enc = new TextEncoder();
  let note = enc.encode("Hello World");
  
  let payTxn = algosdk.makePaymentTxnWithSuggestedParams(myAccount.addr, receiver, 1000000, undefined, note, params);
  payTxn.snd=payTxn.from;
  payTxn.rcv=payTxn.to;
  let result = verifier.verifyTxn(payTxn);

  console.log(payTxn);
  console.log(result);
}