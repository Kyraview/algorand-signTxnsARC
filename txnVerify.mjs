import algosdk from 'algosdk';

export default class TxnVerifer{
  constructor(){
    this.errorCheck = {};
    this.max64 = (2**64)-1;
    this.idTable= {"mainnet-v1.0": "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
        "testnet-v1.0":	"SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
        "betanet-v1.0":	"mFgazF+2uRS1tMiL9dsj01hJGySEmPN28B/TjjvpVW0="};
  }
  verifyTxn(txn){
    this.errorCheck = 
    {   
      valid:true,
      error:[],
      warnings:[]
    };
    const Required = ["type", "from", "fee", "firstRound", "lastRound", "genesisHash"];
    const Optional = ["genesisId", "group", "lease", "note", "reKeyTo"];
    const AssetParamsOpt = ["un", "an", "au", "am", "m", "r", "f", "c"];
    const AppCallOpt = ["apat", "apap", "apaa", "apsu", "apfa", "apas", "appLocalInts", "appLocalByteSlices", "appGlobalInts", "appGlobalByteSlices", "apep"];
    for(var requirement of Required){
      if(!txn[requirement]){
        this.throw(4300, 'Required field missing: '+requirement);
      } else {
        if(requirement === "fee"){
          const fee = requirement
          if(!Number.isInteger(txn[requirement]) || txn[requirement]<1000 || txn[requirement]>this.max64){
            this.throw(4300,'fee must be a uint64 between 1000 and 18446744073709551615');
          }
          else{
            if(txn[fee] > 1000000){
              this.errorCheck.warnings.push('fee is very high: '+txn[fee]+' microalgos');
            }
          }
        }
        if(requirement === "firstRound"){
          if(!Number.isInteger(txn[requirement]) || txn[requirement]<1 || txn[requirement]>this.max64){
            this.throw(4300, 'firstRound must be a uint64 between 1 and 18446744073709551615')
          }
        }
        if(requirement === "genesisHash"){
          if(txn[requirement] instanceof Uint32Array){
            this.throw(4300, 'genesisHash must be Uint32Array');
          }
          let hashString = this.buf264(txn[requirement]);
          if(!Object.values(this.idTable).includes(hashString)){
            this.throw(4300, 'genesisHash must be valid network hash');
          }
        }
        if(requirement === "lastRound"){
          if(!Number.isInteger(txn[requirement]) || txn[requirement]<1 || txn[requirement]>this.max64){
            this.throw(4300, 'lastRound must be uint64 between 1 and 18446744073709551615');
          }
          if(txn[requirement]<txn["firstRound"]){
            this.throw(4300, 'lastRound must be greater or equal to firstRound');
          }
        }
        if(requirement === "from"){
          if(!this.checkAddress(txn[requirement])){
            this.throw(4300, 'from must be a valid sender address');
          }
        }
        if(requirement === "type"){
          if(typeof txn[requirement] !== "string"){
            this.throw(4300, 'type must be a string');
          }
        }
      }
    }
    if(this.errorCheck.valid===true){
      for(var option of Optional){
        if(txn.hasOwnProperty(option)){
          if(option === "genesisId"){
            if(typeof txn[option] !== "string"){
              this.throw(4300, 'genesisId must be a string');
            }
            if(this.idTable[txn[option]] !== this.buf264(txn["genesisHash"])){
              this.throw(4300, 'genesisId must match the same network as genesisHash');
            }
          }
          if(option === "group"){
            if(!txn[option] instanceof Uint32Array){
              this.throw(4300, 'group must be a Uint32Array');
            }
          }
          if(option === "lease"){
            if(!txn[option] instanceof Uint32Array){
              this.throw(4300, 'lease must be a Uint32Array');
            }
          }
          if(option === "note"){
            if(txn[option].byteLength>1000){
              this.throw(4300, 'note must be a UintArray with the amount of bytes less than or equal to 1000');
            }
          }
          if(option === "reKeyTo"){
            if(!this.checkAddress(txn[option])){
              this.throw(4300, 'reKeyTo must be a valid authorized address');
            } else {
              this.errorCheck.warnings.push('this transaction involves rekeying');
            }
          }
        }
      }
    }
    if(this.errorCheck.valid===true){
      if(txn.type === "pay"){
        if(txn.hasOwnProperty('to') && txn.hasOwnProperty('amount')){
          if(!this.checkAddress(txn.to)){
            this.throw(4300, 'to must be a valid receiver address');
          }
          if(!Number.isInteger(txn.amount) || txn.amount<0 || txn.amount>this.max64){
            this.throw(4300, 'amount must be a uint64 between 0 and 18446744073709551615');
          }
        } else {
          this.throw(4300, 'to and amount fields are required in Payment Transaction');
        }
        if(txn.hasOwnProperty('closeRemainderTo') && !this.checkAddress(txn.closeRemainderTo)){
          this.throw(4300, 'close must be a valid CloseRemainderTo address');
        }
      }
      else if(txn.type === "keyreg"){
        this.throw(4200, 'this wallet does not support a Key Registration Txn');
      }
      else if(txn.type === "acfg"){
        if(txn.hasOwnProperty('assetIndex')){
          if(this.checkInt(assetIndex)){
            this.throw(4300, 'assetIndex must be a uint64 between 0 and 18446744073709551615');
          }
        }
        else if(txn.hasOwnProperty('assetDecimals') && txn.hasOwnProperty('assetDefaultFrozen') && txn.hasOwnProperty('assetTotal')){
          if(!this.checkInt(txn.assetDecimals,max=19)){
            this.throw(4300, 'assetDecimals must be a uint32 between 0 and 19');
          }
          if(!this.checkBoolean(txn.assetDefaultFrozen)){
            this.throw(4300, 'assetDefaultFrozen must be a boolean');
          }
          if(!this.checkInt(txn.assetTotal,min=1)){
            this.throw(4300, 'assetTotal must be a uint64 between 1 and 18446744073709551615');
          }
        } else {
          this.throw(4300, 'required fields need to be filled for Asset Config, Create, or Destroy txn');
        }
        if(txn.hasOwnProperty('assetClawback') && !this.checkAddress(txn.assetClawback)){
          this.throw(4300, 'assetClawback must be a valid address');
        }
        if(txn.hasOwnProperty('assetFreeze') && !this.checkAddress(txn.assetFreeze)){
          this.throw(4300, 'assetFreeze must be a valid address');
        }
        if(txn.hasOwnProperty('assetManager') && !this.checkAddress(txn.assetManager)){
          this.throw(4300, 'assetManager must be a valid address');
        }
        if(txn.hasOwnProperty('assetReserve') && !this.checkAddress(txn.assetReserve)){
          this.throw(4300, 'assetReserve must be a valid address');
        }
        if(txn.hasOwnProperty('assetMetadataHash') && !(this.checkString(txn.assetMetadataHash,min=32,max=32) || this.checkUint8(txn.assetMetadataHash,min=32,max=32))){
          this.throw(4300, 'assetMetadataHash must be a valid string or Uint8Array that is 32 bytes in length');
        }
        if(txn.hasOwnProperty('assetName') && !this.checkString(txn.assetName, max=32)){
          this.throw(4300, 'assetName must be a string with a max length of 32 bytes');
        }
        if(txn.hasOwnProperty('assetURL') && !this.checkString(txn.assetURL, max=96)){
          this.throw(4300, 'assetURL must be a string with a max length of 96 bytes');
        }
        if(txn.hasOwnProperty('assetUnitName') && !this.checkString(txn.assetUnitName, max=8)){
          this.throw(4300, 'assetUnitName must be a string with a max length of 8 bytes');
        }
      }
      else if(txn.type === "axfer"){
        if(txn.hasOwnProperty('amount') && txn.hasOwnProperty('assetIndex' && txn.hasOwnProperty('to'))){
          if(!this.checkInt(txn.amount)){
            this.throw(4300, 'amount must be a uint64 between 0 and 18446744073709551615');
          }
          if(this.checkInt(txn.assetIndex)){
            this.throw(4300, 'assetIndex must be a uint64 between 0 and 18446744073709551615');
          }
          if(this.checkAddress(txn.to)){
            this.throw(4300, 'to must be a valid address');
          }
        } else {
          throw(4300, 'amount, assetIndex, and to fields are required in Asset Transfer Txn');
        }
        if(txn.hasOwnProperty('closeRemainderTo') && !this.checkAddress(txn.closeRemainderTo)){
          this.throw(4300, 'closeRemainderTo must be a valid address');
        }
        if(txn.hasOwnProperty('assetRevocationTarget') && this.checkAddress(txn.assetRevocationTarget)){
          this.throw(4300, 'assetRevocationTarget must be a valid address');
        }
      }
      else if(txn.type === "afrz"){
        if(txn.hasOwnProperty('assetIndex') && txn.hasOwnProperty('freezeState') && txn.hasOwnProperty('freezeAccount')){
          if(this.checkInt(txn.assetIndex)){
            this.throw(4300, 'assetIndex must be a uint64 between 0 and 18446744073709551615');
          }
          if(!this.checkBoolean(txn.freezeState)){
            this.throw(4300, 'freezeState must be a boolean');
          }
          if(!this.checkAddress(txn.freezeAccount)){
            this.throw(4300, 'freezeAccount must be a boolean')
          }
        } else {
          this.throw(4300, 'assetIndex, freezeState, and freezeTarget are required in Asset Freeze Txn');
        }
      }
      else if(txn.type === "appl"){
        //create
        if(txn.hasOwnProperty('appIndex') && txn.hasOwnProperty('appApprovalProgram') && txn.hasOwnProperty('appClearProgram') && txn.hasOwnProperty('appGlobalByteSlices') && txn.hasOwnProperty('appGlobalInts') && txn.hasOwnProperty('appLocalByteSlices') && txn.hasOwnProperty('appLocalInts') && txn.hasOwnProperty('onComplete')){
          if(this.checkInt(txn.appIndex)){
            this.throw(4300, 'appIndex must be a uint64 between 0 and 18446744073709551615');
          }
          if(!this.checkUint8(txn.appApprovalProgram),max=2048){
            throw(4300,'appApprovalProgram must be a Uint8Array that is less than 2048 bytes');
          }
          if(!this.checkUint8(txn.appClearProgram),max=2048){
            throw(4300,'appClearProgram must be a Uint8Array that is less than 2048 bytes');
          }
          if(this.checkInt(txn.appGlobalByteSlices,max=16)){
            this.throw(4300, 'appGlobalByteSlices must be a uint64 between 0 and 16');
          }
          if(this.checkInt(txn.appGlobalInts,max=16)){
            this.throw(4300, 'appGlobalInts must be a uint64 between 0 and 16');
          }
          if(this.checkInt(txn.appLocalByteSlices,max=16)){
            this.throw(4300, 'appLocalByteSlices must be a uint64 between 0 and 16');
          }
          if(this.checkInt(txn.appLocalInts,max=16)){
            this.throw(4300, 'appLocalInts must be a uint64 between 0 and 16');
          }
          if(this.checkInt(txn.appOnComplete,max=5)){
            this.throw(4300, 'appOnComplete must be a uint64 between 0 and 16');
          }
        }
        else if(txn.hasOwnProperty('appIndex') && txn.hasOwnProperty('onComplete')){
          if(this.checkInt(txn.appIndex)){
            this.throw(4300, 'appIndex must be a uint64 between 0 and 18446744073709551615');
          }
          if(this.checkInt(txn.appOnComplete,max=5)){
            this.throw(4300, 'appOnComplete must be a uint64 between 0 and 16');
          }
        }
        else if(txn.hasOwnProperty('appIndex') && txn.hasOwnProperty('appApprovalProgram') && txn.hasOwnProperty('appClearProgram')){
            if(this.checkInt(txn.appIndex)){
              this.throw(4300, 'appIndex must be a uint64 between 0 and 18446744073709551615');
            }
            if(!this.checkUint8(txn.appApprovalProgram),max=2048){
              throw(4300,'appApprovalProgram must be a Uint8Array that is less than 2048 bytes');
            }
            if(!this.checkUint8(txn.appClearProgram),max=2048){
              throw(4300,'appClearProgram must be a Uint8Array that is less than 2048 bytes');
            }
          }
        //clearState, closeOut, delete, noOp, optIn
        else if(txn.hasOwnProperty('appIndex')){
            if(this.checkInt(txn.appIndex)){
              this.throw(4300, 'appIndex must be a uint64 between 0 and 18446744073709551615');
            }
        } else{
          throw(4300, 'all required fields need to be filled depending on the target ApplicationTxn');
        }
        //optional appl params
        if(txn.hasOwnProperty('accounts') && this.arrayAddressCheck(txn.appAccounts)){
          this.throw(4300, 'account must be an array of valid addresses');
        }
        if(txn.hasOwnProperty('appArgs') && this.arrayUint8Check(txn.appArgs)){
          this.throw(4300, 'appArgs must be an array of Uint8Arrays');
        }
        if(!this.checkUint8(txn.appApprovalProgram),max=2048){
          throw(4300,'appApprovalProgram must be a Uint8Array that is less than 2048 bytes');
        }
        if(!this.checkUint8(txn.appClearProgram),max=2048){
          throw(4300,'appClearProgram must be a Uint8Array that is less than 2048 bytes');
        }
        if(this.checkInt(txn.appGlobalByteSlices,max=16)){
          this.throw(4300, 'appGlobalByteSlices must be a uint64 between 0 and 16');
        }
        if(this.checkInt(txn.appGlobalInts,max=16)){
          this.throw(4300, 'appGlobalInts must be a uint64 between 0 and 16');
        }
        if(this.checkInt(txn.appLocalByteSlices,max=16)){
          this.throw(4300, 'appLocalByteSlices must be a uint64 between 0 and 16');
        }
        if(this.checkInt(txn.appLocalInts,max=16)){
          this.throw(4300, 'appLocalInts must be a uint64 between 0 and 16');
        }
        if(txn.hasOwnProperty('extraPages') && this.checkInt(txn.extraPages,max=3)){
          this.throw(4300, 'extraPages must be a uint64 between 0 and 3');
        }
        if(txn.hasOwnProperty('appForeignApps') && this.checkIntArray(txn.appForeignApps)){
          this.throw(4300, 'appForeignApps must be an array of uint64s between 0 and 18446744073709551615');
        }
        if(txn.hasOwnProperty('appForeignAssets') && this.checkIntArray(txn.appForeignAssets)){
          this.throw(4300, 'appForeignAssets must be an array of uint64s between 0 and 18446744073709551615');
        }
      }
      else{
        throw(4300, 'must specify the type of transaction');
      }
    }

    return this.errorCheck;
  }
  stringBytes(str){
    return Buffer.from(str).length;
  }
  buf264(buf){
    var binstr = Array.prototype.map.call(buf, function (ch) {
        return String.fromCharCode(ch);
    }).join('');
    return btoa(binstr);
  }
  checkInt(value, min, max){
    if(min === undefined){
      min = 0;
    }
    if(max === undefined){
      max = this.max64;
    }
    if(Number.isInteger(value) && value>=min && value<=max){
      return true;
    } return false;
  }
  checkBoolean(value){
    if(typeof value === 'boolean'){
      return true;
    } return false;
  }
  checkString(value, min, max){
    if(min === undefined){
      min = 0;
    }
    if(max === undefined){
      max = this.max64;
    }
    if(typeof value === 'string' && value.length>=min && value.length<=max){
      return true;
    } return false;
  }
  checkUint8(value, min, max){
    if(min === undefined){
      min = 0;
    }
    if(max === undefined){
      max = this.max64;
    }
    if(value.byteLength !== 'undefined' && value.byteLength>=min && value.byteLength<=max){
      return true;
    } return false;
  }
  checkAddress(addr){
    try{
      addr = algosdk.encodeAddress(addr.publicKey);
    } catch {}
    return algosdk.isValidAddress(addr);
  }
  arrayAddressCheck(array){
    if(Object.prototype.toString.call(array) === '[object Array]') {
      for(var address of array){
        if(!this.checkAddress(address)){
          return false;
        }
      }
      return true;
    }
    return false;
  }
  arrayUint8Check(array){
    if(Object.prototype.toString.call(array) === '[object Array]') {
      for(var arg of array){
        if(arg.byteLength === 'undefined'){
          return false;
        }
      }
      return true;
    }
    return false;
  }
  checkIntArray(array){
    if(Object.prototype.toString.call(array) === '[object Array]') {
      for(var value of array){
        if!(Number.isInteger(value) && value>=0 && value<=this.max64){
          return false;
        }
      }
      return true;
    }
    return false;
  }
  throw(code, message){
    this.errorCheck.valid=false;
    this.errorCheck.error.push({code:code,message:message});
  }
}