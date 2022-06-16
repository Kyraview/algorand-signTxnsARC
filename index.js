import algosdk from 'algosdk';
import TxnVerifer from './txnVerify.mjs';
let verifier = new TxnVerifer();
const enc = new TextEncoder();

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

  let suggestedParams = await algodClient.getTransactionParams().do();
  let overallParams = {
    amount: 100000,
    assetIndex: 100000,
    from: myAccount.addr,
    numGlobalInts: 100,
    numGlobalByteSlices: 100,
    numLocalInts: 100,
    numLocalByteSlices: 100,
    note: enc.encode("Hello World"),
    strictEmptyAddressChecking: false,
    suggestedParams:suggestedParams,
    to: "GD64YIY3TWGDMCNPP553DZPPR6LDUSFQOIJVFDPPXWEG3FVOJCCDBBHU5A"
  }
  
  let payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject(overallParams);
  let payTemp;
  payTxn.snd=payTxn.from;
  payTxn.rcv=payTxn.to;
  console.log('valid payment txn: ',verifier.verifyTxn(payTxn),'\n');
  payTemp=Object.create(payTxn);
  payTemp.snd=5;
  console.log('invalid address: ',verifier.verifyTxn(payTemp),'\n');
  payTemp=Object.create(payTxn);
  payTemp.amount='wrong';
  console.log('invalid amount added: ',verifier.verifyTxn(payTemp),'\n');
  payTemp=Object.create(payTxn);
  payTemp.rekey='wrong';
  console.log('invalid rekey address added: ',verifier.verifyTxn(payTemp),'\n\n');

  let keyregTxn = algosdk.makeKeyRegistrationTxnWithSuggestedParamsFromObject(overallParams);
  keyregTxn.snd=keyregTxn.from;
  console.log('keyreg txn is not supported: ',verifier.verifyTxn(keyregTxn),'\n\n');

  let acfgTxn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject(overallParams);
  let acfgTemp;
  acfgTxn.snd=acfgTxn.from;
  acfgTxn.apar={t:10000, dc:0, df:true};
  console.log('valid acfg txn: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTemp=Object.create(acfgTxn);
  acfgTemp.fee=-15;
  console.log('invalid fee: ',verifier.verifyTxn(acfgTemp),'\n');
  acfgTemp=Object.create(acfgTxn);
  acfgTemp.assetIndex='wrong';
  console.log('invalid assetIndex: ',verifier.verifyTxn(acfgTemp),'\n');
  acfgTemp=Object.create(acfgTxn);
  acfgTemp.apar.au=98198901389;
  console.log('invalid opt url: ',verifier.verifyTxn(acfgTemp),'\n\n');

  let axferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(overallParams);
  let axferTemp;
  axferTxn.snd=axferTxn.from;
  axferTxn.asnd=axferTxn.from;
  axferTxn.arcv=axferTxn.to;
  console.log('showing of the stacked errors feature\n');
  console.log('valid axfer txn: ',verifier.verifyTxn(axferTxn),'\n');
  axferTemp=axferTxn;
  axferTemp.assetIndex=-15;
  console.log('invalid assetIndex: ',verifier.verifyTxn(axferTemp),'\n');
  axferTemp=axferTxn;
  axferTemp.aclose=-15;
  console.log('invalid AssetCloseTo address but uncaught due to being a clawback txn: ',verifier.verifyTxn(axferTemp),'\n');
  axferTemp=axferTxn;
  axferTemp.arcv=-15;
  console.log('invalid AssetReceiver address: ',verifier.verifyTxn(axferTemp),'\n\n');

  let afrzTxn = algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject(overallParams);
  let afrzTemp;
  afrzTxn.snd=afrzTxn.from;
  afrzTxn.fadd=afrzTxn.from;
  afrzTxn.afrz=true;
  console.log('valid asset freeze txn: ',verifier.verifyTxn(afrzTxn),'\n');
  afrzTemp=afrzTxn;
  afrzTemp.fadd='wrong';
  console.log('invalid FreezeAccount: ',verifier.verifyTxn(afrzTemp),'\n');
  afrzTemp.assetIndex='wrong';
  console.log('invalid assetIndex: ',verifier.verifyTxn(afrzTemp),'\n');
  afrzTemp.afrz='wrong';
  console.log('invalid AssetFrozen: ',verifier.verifyTxn(afrzTemp),'\n\n');

  let applTxn = algosdk.makeApplicationCallTxnFromObject(overallParams);
  let applTemp;
  applTxn.snd=applTxn.from;
  applTxn.apid=100000;
  applTxn.apan=0;
  console.log('valid application call txn: ',verifier.verifyTxn(applTxn),'\n');
  applTemp=applTxn;
  applTemp.apas='wrong';
  console.log('invalid ForeignAssets: ',verifier.verifyTxn(applTemp),'\n');
  applTemp.apas=[applTxn.from,applTxn.snd];
  console.log('valid ForeignAssets: ',verifier.verifyTxn(applTemp),'\n');
  applTemp.appGlobalInts='wrong';
  console.log('invalid numGlobalInts: ',verifier.verifyTxn(applTemp),'\n');
}