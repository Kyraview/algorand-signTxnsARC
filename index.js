import algosdk from 'algosdk';
import TxnVerifer from './txnVerify.mjs';
let verifier = new TxnVerifer();
const enc = new TextEncoder();

testTxns();

async function testTxns(){
  var account = algosdk.generateAccount();
  var passphrase = algosdk.secretKeyToMnemonic(account.sk);

  const token = '';
  const algodServer = 'https://testnet-api.algonode.cloud';
  const port = 443;
  const algodClient = new algosdk.Algodv2(token, algodServer, port);
  
  let myAccount = algosdk.mnemonicToSecretKey(passphrase);

  let suggestedParams = await algodClient.getTransactionParams().do();
  let overallParams = {
    accounts: ["GD64YIY3TWGDMCNPP553DZPPR6LDUSFQOIJVFDPPXWEG3FVOJCCDBBHU5A"],
    amount: 100000,
    appArgs: [enc.encode("test")],
    appIndex:100000,
    approvalProgram: enc.encode("test"),
    assetIndex: 100000,
    assetMetadataHash: enc.encode("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"), //length 32
    assetName: 'test',
    assetURL: 'test',
    clawback: myAccount.addr,
    clearProgram: enc.encode("test"),
    closeRemainderTo: myAccount.addr,
    decimals: 18,
    defaultFrozen: false,
    extraPages: 2, //0 to 3
    foreignApps: [100],
    foreignAssets: [100],
    freeze: myAccount.addr,
    freezeState: false,
    freezeTarget: myAccount.addr,
    from: myAccount.addr,
    lease: enc.encode("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"), //length 32
    manager: myAccount.addr,
    numGlobalInts: 10000000000,
    numGlobalByteSlices: 10000000000,
    numLocalInts: 100000000000,
    numLocalByteSlices: 100000000000,
    note: enc.encode("Hello World"),
    onComplete: 0,
    rekeyTo: myAccount.addr,
    reserve: myAccount.addr,
    revocationTarget: myAccount.addr,
    stricTxntyAddressChecking: false,
    suggestedParams:suggestedParams,
    to: "GD64YIY3TWGDMCNPP553DZPPR6LDUSFQOIJVFDPPXWEG3FVOJCCDBBHU5A",
    total: 100000,
    unitName: 'test'
  }
  
  let payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject(overallParams);
  console.log('valid payment txn: ',verifier.verifyTxn(payTxn),'\n');
  payTxn.to='wrong';
  console.log('invalid to address: ',verifier.verifyTxn(payTxn),'\n');
  payTxn.amount='wrong';
  console.log('invalid amount: ',verifier.verifyTxn(payTxn),'\n');
  payTxn.reKeyTo='wrong';
  console.log('invalid rekey address: ',verifier.verifyTxn(payTxn),'\n\n');

  let keyregTxn = algosdk.makeKeyRegistrationTxnWithSuggestedParamsFromObject(overallParams);
  console.log('keyreg txn is not supported: ',verifier.verifyTxn(keyregTxn),'\n\n');

  let acfgTxn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject(overallParams);
  console.log('valid asset config txn: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTxn.assetFreeze = -15;
  console.log('invalid freeze addr: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTxn.assetClawback='wrong';
  console.log('invalid clawback addr: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTxn.note = -15;
  console.log('invalid note: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTxn.fee=-15;
  console.log('invalid fee: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(overallParams);
  console.log('valid asset create txn: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTxn.assetName=-15;
  console.log('invalid assetName: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTxn.assetDecimals=-15;
  console.log('invalid assetDecimals: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTxn.lease=-15;
  console.log('invalid lease: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTxn=algosdk.makeAssetDestroyTxnWithSuggestedParamsFromObject(overallParams);
  console.log('valid asset destroy txn: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTxn.assetIndex=-15;
  console.log('invalid assetIndex: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTxn.group=-15;
  console.log('invalid group: ',verifier.verifyTxn(acfgTxn),'\n');
  acfgTxn.genesisHash=-15;
  console.log('invalid genesisHash: ',verifier.verifyTxn(acfgTxn),'\n');
  
  let axferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(overallParams);
  console.log('valid axfer txn: ',verifier.verifyTxn(axferTxn),'\n');
  axferTxn.assetRevocationTarget=-15;
  console.log('invalid assetRevocationTarget: ',verifier.verifyTxn(axferTxn),'\n');
  axferTxn.assetIndex=-15;
  console.log('invalid assetIndex: ',verifier.verifyTxn(axferTxn),'\n');
  axferTxn.from=-15;
  console.log('invalid from addr: ',verifier.verifyTxn(axferTxn),'\n');

  let afrzTxn = algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject(overallParams);
  console.log('valid asset freeze txn: ',verifier.verifyTxn(afrzTxn),'\n');
  afrzTxn.assetIndex='wrong';
  console.log('invalid assetIndex: ',verifier.verifyTxn(afrzTxn),'\n');
  afrzTxn.freezeAccount=-15;
  console.log('invalid freezeAccount: ',verifier.verifyTxn(afrzTxn),'\n');
  afrzTxn.freezeState=-15;
  console.log('invalid freezeState: ',verifier.verifyTxn(afrzTxn),'\n');

  let applTxn = algosdk.makeApplicationCallTxnFromObject(overallParams);
  console.log('valid application call txn: ',verifier.verifyTxn(applTxn),'\n');
  applTxn.appGlobalInts='wrong';
  console.log('invalid numGlobalInts: ',verifier.verifyTxn(applTxn),'\n');
  applTxn = algosdk.makeApplicationClearStateTxnFromObject(overallParams);
  console.log('valid application clearState txn: ',verifier.verifyTxn(applTxn),'\n');
  applTxn = algosdk.makeApplicationCloseOutTxnFromObject(overallParams);
  console.log('valid application closeOut txn: ',verifier.verifyTxn(applTxn),'\n');
  applTxn = algosdk.makeApplicationCreateTxnFromObject(overallParams);
  console.log('valid application create txn: ',verifier.verifyTxn(applTxn),'\n');
  applTxn.appOnComplete=600;
  console.log('invalid appOnComplete: ',verifier.verifyTxn(applTxn),'\n');
  applTxn = algosdk.makeApplicationDeleteTxnFromObject(overallParams);
  console.log('valid application delete txn: ',verifier.verifyTxn(applTxn),'\n');
  applTxn = algosdk.makeApplicationNoOpTxnFromObject(overallParams);
  console.log('valid application noOp txn: ',verifier.verifyTxn(applTxn),'\n');
  applTxn = algosdk.makeApplicationOptInTxnFromObject(overallParams);
  console.log('valid application optIn txn: ',verifier.verifyTxn(applTxn),'\n');
  applTxn = algosdk.makeApplicationUpdateTxnFromObject(overallParams);
  console.log('valid application update txn: ',verifier.verifyTxn(applTxn),'\n');
  applTxn.type=-15;
  console.log('invalid type: ',verifier.verifyTxn(applTxn),'\n');
  applTxn.firstRound=-15;
  console.log('invalid firstRound: ',verifier.verifyTxn(applTxn),'\n');
  applTxn.lastRound=-15;
  console.log('invalid lastRound: ',verifier.verifyTxn(applTxn),'\n');
}