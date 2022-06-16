//no opts
enable();

//given both
//matching
enable({genesisId:"mainnet-v1.0",
        genesisHash:"wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8="});
//wrong genesisHash
enable({genesisId:"mainnet-v1.0",
        genesisHash:"wGHE2Pwdvd7S12BL5FaO"});
//wrong genesisId
enable({genesisId:"testnet-v1.0",
        genesisHash:"wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8="});

//given id only
//sets genesisHash to that of mainnet
enable({genesisId:"mainnet-v1.0"});
//unknown network
enable({genesisId:"fakenet-v1.0"});

//given hash only
//sets genesisId to mainnet
enable({genesisHash:"wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8="});
//unknown network
enable({genesisHash:"wGHE2Pwdvd7S12BktiC1qzkkit8="});