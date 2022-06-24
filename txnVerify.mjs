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
        //asset clawback
        if(txn.hasOwnProperty('from') && txn.hasOwnProperty('assetIndex') && txn.hasOwnProperty('amount') && txn.hasOwnProperty('afrom') && txn.hasOwnProperty('ato')){
          if(!this.checkAddress(txn.from)){
            this.throw(4300, 'from must be a valid Sender address');
          }
          if(!Number.isInteger(txn.assetIndex) || txn.assetIndex<0 || txn.assetIndex>this.max64){
            this.throw(4300, 'assetIndex must be a uint64 between 0 and 18446744073709551615');
          }
          if(!Number.isInteger(txn.amount) || txn.amount<0 || txn.amount>this.max64){
            this.throw(4300, 'amount must be a uint64 between 0 and 18446744073709551615');
          }
          if(!this.checkAddress(txn.afrom)){
            this.throw(4300, 'afrom must be a valid AssetSender address');
          }
          if(!this.checkAddress(txn.ato)){
            this.throw(4300, 'ato must be a valid AssetReceiver address');
          }
        }
        //asset xfer
        else if(txn.hasOwnProperty('assetIndex') && txn.hasOwnProperty('amount') && txn.hasOwnProperty('afrom') && txn.hasOwnProperty('ato')){
          if(!Number.isInteger(txn.assetIndex) || txn.assetIndex<0 || txn.assetIndex>this.max64){
            this.throw(4300, 'assetIndex must be a uint64 between 0 and 18446744073709551615');
          }
          if(!Number.isInteger(txn.amount) || txn.amount<0 || txn.amount>this.max64){
            this.throw(4300, 'amount must be a uint64 between 0 and 18446744073709551615');
          }
          if(!this.checkAddress(txn.afrom)){
            this.throw(4300, 'afrom must be a valid AssetSender address');
          }
          if(!this.checkAddress(txn.ato)){
            this.throw(4300, 'ato must be a valid AssetReceiver address');
          }
          if(txn.hasOwnProperty('aclose') && !this.checkAddress(txn.aclose)){
            this.throw(4300, 'aclose must be a valid AssestCloseTo address');
          }
        }
        //asset accept
        else if(txn.hasOwnProperty('assetIndex') && txn.hasOwnProperty('from') && txn.hasOwnProperty('ato')){
          if(!Number.isInteger(txn.assetIndex) || txn.assetIndex<0 || txn.assetIndex>this.max64){
            this.throw(4300, 'assetIndex must be a uint64 between 0 and 18446744073709551615');
          }
          if(!this.checkAddress(txn.from)){
            this.throw(4300, 'from must be a valid Sender address');
          }
          if(!this.checkAddress(txn.ato)){
            this.throw(4300, 'ato must be a valid AssetReceiver address');
          }
        }
        else{
          this.throw(4300, 'all required fields need to filled according to if an Asset Transfer, Asset Accept, or Asset Clawback Txn was chosen')
        }
      }
      else if(txn.type === "afrz"){
        if(txn.hasOwnProperty('fadd') && txn.hasOwnProperty('assetIndex') && txn.hasOwnProperty('afrz')){
          if(!this.checkAddress(txn.fadd)){
            this.throw(4300, 'fadd must be a valid FreezeAccount address');
          }
          if(!Number.isInteger(txn.assetIndex) || txn.assetIndex<0 || txn.assetIndex>this.max64){
            this.throw(4300, 'assetIndex must be a uint64 between 0 and 18446744073709551615');
          }
          if(typeof txn.afrz !== 'boolean'){
            this.throw(4300, 'afrz must be a boolean')
          }
        } else {
          this.throw(4300, 'fadd, assetIndex, and afrz fields are required in Asset Freeze Txn');
        }
      }
      else if(txn.type === "appl"){
        if(txn.hasOwnProperty('apid') && txn.hasOwnProperty('apan')){
          if(!Number.isInteger(txn.apid) || txn.apid<0 || txn.apid>this.max64){
            this.throw(4300, 'apid must be a uint64 between 0 and 18446744073709551615; apid should be empty if creating');
          }
          if(!Number.isInteger(txn.apan) || txn.apan<0 || txn.apan>5){
            this.throw(4300, 'apan must be a uint64 between 0 and 5');
          }
          for (var opt of AppCallOpt){
            if(txn.hasOwnProperty(opt)){
              if(opt === "apat" && !this.arrayAddressCheck(txn[opt])){
                this.throw(4300, 'apat must be an array of valid addresses');
              }
              if(opt === "apap" && txn[opt].byteLength === undefined){
                this.throw(4300, 'apap must be a []byte')
              }
              if(opt === "apaa" && txn[opt].byteLength === undefined){
                this.throw(4300, 'apaa must be a []byte')
              }
              if(opt === "apsu" && txn[opt].byteLength === undefined){
                this.throw(4300, 'apsu must be a []byte')
              }
              if(opt === "apfa" && !this.arrayAddressCheck(txn[opt])){
                this.throw(4300, 'apfa must be an array of valid addresses');
              }
              if(opt === "apas" && !this.arrayAddressCheck(txn[opt])){
                this.throw(4300, 'apas must be an array of valid addresses');
              }
              if(opt === "appGlobalInts" || opt === "appGlobalByteSlices" || opt === "appLocalByteSlices" || opt === "appLocalByteSlices"){
                if(!Number.isInteger(txn[opt]) || txn[opt]<0 || txn[opt]>this.max64){
                  this.throw(4300, opt+' must be a uint64 between 0 and 18446744073709551615');
                }
              }
            }
          }
        } else {
          this.throw(4300, 'apid and apan fields are required in Application Call Txn');
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
  throw(code, message){
    this.errorCheck.valid=false;
    this.errorCheck.error.push({code:code,message:message});
  }
}