import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ADDRESS_ZERO, ZERO, MAX_VALUE } from '../constants/various';
import { STAKING, ETHBOX, TOKEN_DISPENSER, ERC20_ABI } from '../constants/abis';
import { chainTokenDictionary } from '../constants/tokens';
import { TokenData, TokenBalance, Box, BoxInputs } from '../interfaces';
import { LoadingIndicatorService } from './loading-indicator.service';
import { ToasterService } from './toaster.service';
import BigNumber from 'bignumber.js';
import { ConfirmDialogService } from './confirm-dialog.service';
import { SmartInterval } from '../../assets/js/custom-utils';

// This is needed to get Web3 and Web3Modal into this service
let win: any = window;

@Injectable({
    providedIn: 'root'
})
export class ContractService {

    // Observables tied to various events, see these as top level variables in the app context
    // Subject simply emits a value that can be listened only by those who are currently listening
    // BehaviorSubject emits a value but also remembers it for future listeners, that value can also be read at anytime by using getValue()
    tokens$ = new BehaviorSubject(null);

    // These variables are just for the boxes loop, there is a SmartInterval objects that's used to fetch boxes over time so that a new request doesn't happen before the last has already resolved
    incomingBoxes$ = new BehaviorSubject(null);
    outgoingBoxes$ = new BehaviorSubject(null);
    private boxesIntervalCycleDelay = 15e3;
    private boxesIntervalStartDelay = 0;
    private boxesInterval;

    chainId$ = new BehaviorSubject(null);
    isChainSupported$ = new BehaviorSubject(false);
    isEthereumMainnet$ = new BehaviorSubject(false);
    selectedAccount$ = new BehaviorSubject(null);
    
    isAppReady$ = new BehaviorSubject(false);
    isStakingReady$ = new BehaviorSubject(false);
    isGovernanceReady$ = new BehaviorSubject(false);

    approvalInteraction$ = new Subject();
    boxInteraction$ = new Subject();
    stakingInteraction$ = new Subject();
    tokenDispenserInteraction$ = new Subject();

    // Tokens map lets you query tokens by their addresses in O(1), useful to find logos and decimals in a blink of an eye
    tokensMap;

    // These fields are changing values when chain is changed (look fetchVariables())
    private testTokensAddresses = {
        'AAA': null,
        'BBB': null,
        'CCC': null
    };
    private ethboxAddress;
    private tokenDispenserAddress;
    private tokenDispenserContract;
    private ethboxContract;

    private stakingAddress;
    private stakingContract;

    // Unpkg imports
    private Web3Modal = win.Web3Modal.default;
    private WalletConnectProvider = win.WalletConnectProvider.default;
    private Fortmatic = win.Fortmatic;

    // API keys for various providers
    private WALLECTCONNECT_APIKEY = '8043bb2cf99347b1bfadfb233c5325c0'; // Mikko's key
    private FORTMATIC_APIKEY = 'pk_test_391E26A3B43A3350'; // Mikko's key

    private web3Modal;
    private provider;
    private web3;

    constructor(
        private loadingIndicatorServ: LoadingIndicatorService,
        private ngZone: NgZone,
        private toasterServ: ToasterService,
        private confirmDialogServ: ConfirmDialogService) {
        this.init();
    }

    async connect(): Promise<void> {

        try {
            this.provider = await this.web3Modal.connect();
            this.web3 = new win.Web3(this.provider);
        }
        catch (error) {
            this.toasterServ.toastMessage$.next({
                type: 'danger',
                message: 'Wallet connection failed!',
                duration: 'long'
            });
            console.log('Could not get a wallet connection', error);
            return;
        }

        // Adds listeners to refresh variables on chain and accounts changes
        this.provider.on('chainChanged', () =>
            this.ngZone.run(() => this.fetchVariables()));
        this.provider.on('accountsChanged', () =>
            this.ngZone.run(() => this.fetchVariables()));

        // Wallet initialized
        await this.fetchVariables();
    }

    async disconnect(): Promise<void> {

        if (this.provider.close) {
            await this.provider.close();

            // If the cached provider is not cleared, WalletConnect will default to the existing session and does not allow to re-scan the QR code with a new wallet
            await this.web3Modal.clearCachedProvider();
            this.provider = null;
        }

        this.web3 = null;
        this.provider.removeAllListeners('chainChanged');
        this.provider.removeAllListeners('accountsChanged');
        this.provider = null;

        this.chainId$.next(null);
        this.isChainSupported$.next(false);
        this.isEthereumMainnet$.next(false);
        this.selectedAccount$.next(null);

        this.resetVariables();
        this.loadingIndicatorServ.off();
    }

    private init(): void {

        console.log('WalletConnectProvider is', this.WalletConnectProvider);
        console.log('Fortmatic is', this.Fortmatic);
        let providerOptions = {
            walletconnect: {
                package: this.WalletConnectProvider,
                options: {
                    infuraId: this.WALLECTCONNECT_APIKEY
                }
            },
            fortmatic: {
                package: this.Fortmatic,
                options: {
                    key: this.FORTMATIC_APIKEY
                }
            }
        };

        this.web3Modal = new this.Web3Modal({
            cacheProvider: false,
            providerOptions,
            disableInjectedProvider: false
        });
        console.log('Web3Modal instance is', this.web3Modal);

        this.boxesInterval = new SmartInterval(
            async () => {
                this.incomingBoxes$.next(await this.getIncomingBoxes());
                this.outgoingBoxes$.next(await this.getOutgoingBoxes());
            },
            this.boxesIntervalCycleDelay,
            this.boxesIntervalStartDelay
        );
    }

    private async fetchVariables(): Promise<void> {

        this.resetVariables();
        this.loadingIndicatorServ.on();

        // Retrieving the chainId
        let chainId = await this.web3.eth.getChainId();
        this.chainId$.next(chainId);

        // Retrieving the selectedAccount
        let accounts = await this.web3.eth.getAccounts();
        let selectedAccount = accounts[0];
        this.selectedAccount$.next(selectedAccount);

        // If there's no account selected stop here, there's no point in going further
        if (!selectedAccount) {
            this.loadingIndicatorServ.off();
            return;
        }

        // Sets the addresses for the contracts depending on the current chain
        // If the user is on the wrong chain, then resets and return
        if (chainId == 1) { // 1 = Ethereum Mainnet

            // Signaling mainnet
            this.isEthereumMainnet$.next(true);

            // Instantiating the staking contract
            this.stakingAddress = STAKING.ADDRESSES.ETHEREUM;
            this.stakingContract = new this.web3.eth
                .Contract(STAKING.ABI, this.stakingAddress);

            this.isStakingReady$.next(true);
            this.isGovernanceReady$.next(true);

            console.log('Selected chain is Ethereum');
            console.log('Staking contract address is', this.stakingAddress);
        }
        else if (chainId == 4) { // 4 = Rinkeby

            // Signaling the chain is supported
            this.isChainSupported$.next(true);

            this.ethboxAddress = ETHBOX.ADDRESSES.RINKEBY;
            this.tokenDispenserAddress = TOKEN_DISPENSER.ADDRESSES.RINKEBY;
            this.loadTokens();
            this.boxesInterval.start();

            console.log('Selected chain is Rinkeby');
            console.log('Ethbox contract address is', this.ethboxAddress);
            console.log('Supported tokens are', this.tokens$.getValue());

            await this.instantiateAppContracts();
        }
        else if (chainId == 97) { // 97 = BSC Testnet

            // Signaling the chain is supported
            this.isChainSupported$.next(true);

            this.ethboxAddress = ETHBOX.ADDRESSES.BSC_TESTNET;
            this.tokenDispenserAddress = TOKEN_DISPENSER.ADDRESSES.BSC_TESTNET;
            this.loadTokens();
            this.boxesInterval.start();

            console.log('Selected chain is BSC Testnet');
            console.log('Ethbox contract address is', this.ethboxAddress);
            console.log('Supported tokens are', this.tokens$.getValue());

            await this.instantiateAppContracts();
        }
        else {
            this.resetVariables();
        }
        this.loadingIndicatorServ.off();
    }

    loadTokens() {

        let LSKey = `customTokens${this.chainId$.getValue()}`;

        let customTokens = [],
            curatedTokens = [];

        // Take custom tokens from localStorage and give them the unknown icon
        let customTokensLS = localStorage.getItem(LSKey);
        if (customTokensLS) {
            customTokens = JSON.parse(customTokensLS);
            customTokens.forEach(token => token.thumb = 'assets/img/unknown-icon.png');
        }

        // Take tokens from curated lists for the current network
        curatedTokens = chainTokenDictionary[this.chainId$.getValue()];

        let mergedResults = [...customTokens, ...curatedTokens];
        this.tokensMap = mergedResults.reduce((a, b) => (a[b.address] = b, a), {});;
        this.tokens$.next(mergedResults);
    }

    private async instantiateAppContracts() {

        // Instantiates the contracts
        this.ethboxContract = new this.web3.eth
            .Contract(ETHBOX.ABI, this.ethboxAddress);
        this.tokenDispenserContract = new this.web3.eth
            .Contract(TOKEN_DISPENSER.ABI, this.tokenDispenserAddress);

        // Gets the addresses for the test tokens
        this.testTokensAddresses.AAA = await this.tokenDispenserContract.methods
            .token1().call();
        this.testTokensAddresses.BBB = await this.tokenDispenserContract.methods
            .token2().call();
        this.testTokensAddresses.CCC = await this.tokenDispenserContract.methods
            .token3().call();

        // The app is ready and both ethboxContract and tokenDispenserContract can be used safely
        this.isAppReady$.next(true);
    }

    private resetVariables() {

        this.ethboxContract = null;
        this.tokenDispenserContract = null;
        this.stakingContract = null;

        this.tokens$.next(null);

        this.boxesInterval.stop();
        this.incomingBoxes$.next(null);
        this.outgoingBoxes$.next(null);

        this.isAppReady$.next(false);
        this.isStakingReady$.next(false);
        this.isGovernanceReady$.next(false);

        this.isChainSupported$.next(false);
        this.isEthereumMainnet$.next(false);
    }

    private async getBox(boxIndex: number) {
        return await this.ethboxContract.methods.getBox(boxIndex)
            .call({ from: this.selectedAccount$.getValue() });
    }

    give100TestToken(testTokenSymbol: string): void {

        this.tokenDispenserContract.methods
            .give_token(
                win.Web3.utils.toWei('100'),
                this.testTokensAddresses[testTokenSymbol])
            .send({ from: this.selectedAccount$.getValue() })
            .on('transactionHash', hash =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'secondary',
                        message: 'Waiting for transaction to confirm (may take a while, depending on network load)...',
                        duration: 'short'
                    });

                    this.loadingIndicatorServ.on();
                }))
            .on('receipt', receipt =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'success',
                        message: `You have received 100 ${testTokenSymbol} tokens!`,
                        duration: 'long'
                    });

                    this.tokenDispenserInteraction$.next(true);
                    this.loadingIndicatorServ.off();
                }))
            .on('error', (error, receipt) =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'danger',
                        message: 'Token dispending aborted by user.',
                        duration: 'long'
                    });
                    console.log('Token dispensing aborted', error, receipt);

                    this.loadingIndicatorServ.off();
                }));
    }

    isEthereum(): boolean {
        return [1, 4].includes(this.chainId$.getValue());
    }

    isBinance(): boolean {
        return [56, 97].includes(this.chainId$.getValue());
    }

    isEthereumMainnet(): boolean {
        return this.chainId$.getValue() == 1;
    }

    isBinanceMainnet(): boolean {
        return this.chainId$.getValue() == 56;
    }

    isEthereumTestnet(): boolean {
        return this.chainId$.getValue() == 4;
    }

    isBinanceTestnet(): boolean {
        return this.chainId$.getValue() == 97;
    }

    isValidAddress(address: string): boolean {
        return win.Web3.utils.isAddress(address);
    }

    weiToDecimal(wei: string, decimals: string | number): string {
        let multiplier = '1' + ZERO.repeat(Number(decimals));
        let _wei = new BigNumber(wei);
        return _wei.dividedBy(multiplier).toFixed();
    }

    decimalToWei(decimalValue: string, decimals: string | number): string {
        let multiplier = '1' + ZERO.repeat(Number(decimals));
        let _decimal = new BigNumber(decimalValue);
        return _decimal.multipliedBy(multiplier).toFixed();
    }

    private async getWeiAllowance(tokenAddress: string): Promise<string> {

        let tokenContract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);

        let allowance = await tokenContract.methods
            .allowance(this.selectedAccount$.getValue(), this.ethboxAddress)
            .call({ from: this.selectedAccount$.getValue() });

        return allowance;
    }

    async getTokenData(tokenAddress: string): Promise<TokenData> {

        let name,
            symbol,
            decimals;
        let thumb = 'assets/img/unknown-icon.png';

        // If the token resides in the curated list, then take it the data from there
        if (this.tokensMap[tokenAddress]) {
            name = this.tokensMap[tokenAddress].name;
            symbol = this.tokensMap[tokenAddress].symbol;
            decimals = this.tokensMap[tokenAddress].decimals;
            thumb = this.tokensMap[tokenAddress].thumb;
        }
        // Otherwise take the data from the blockchain
        else {
            let selectedAccount = this.selectedAccount$.getValue();
            try {
                let tokenContract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);
                decimals = await tokenContract.methods
                    .decimals()
                    .call({ from: selectedAccount });
                name = await tokenContract.methods
                    .name()
                    .call({ from: selectedAccount });
                symbol = await tokenContract.methods
                    .symbol()
                    .call({ from: selectedAccount });
            }
            catch (err) {
                this.toasterServ.toastMessage$.next({
                    type: 'danger',
                    message: 'Address interface is not that of a valid contract!',
                    duration: 'long'
                });
                console.log('getTokenData() error:', err);
                return;
            }
        }

        return {
            address: tokenAddress,
            name,
            symbol,
            decimals,
            thumb
        };
            
    }

    async getTokenBalance(tokenAddress: string): Promise<TokenBalance> {

        let tokenData = await this.getTokenData(tokenAddress);

        let selectedAccount = this.selectedAccount$.getValue();

        let wei,
            weiAllowance;

        // If it's the base token, then mocks the allowance as unlimited (MAX_VALUE)
        if (tokenAddress == ADDRESS_ZERO) {
            wei = await this.web3.eth
                .getBalance(selectedAccount);
            weiAllowance = MAX_VALUE;
        }
        else {
            let tokenContract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);

            try {
                wei = await tokenContract.methods
                    .balanceOf(selectedAccount)
                    .call({ from: selectedAccount });
                weiAllowance = await this.getWeiAllowance(tokenAddress);
            }
            catch (err) {
                this.toasterServ.toastMessage$.next({
                    type: 'danger',
                    message: 'Address interface is not that of a valid contract!',
                    duration: 'long'
                });
                console.log('getTokenBalance() error:', err);
                return;
            }
        }

        return {
            address: tokenAddress,
            wei,
            weiAllowance,
            decimalValue: this.weiToDecimal(wei, tokenData.decimals),
            decimalAllowance: this.weiToDecimal(weiAllowance, tokenData.decimals)
        };
    }

    async approveMax(tokenAddress: string): Promise<void> {

        let tokenContract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);

        this.loadingIndicatorServ.on();
        try {
            await tokenContract.methods
                .approve(this.ethboxAddress, MAX_VALUE)
                .send({ from: this.selectedAccount$.getValue() });

            this.toasterServ.toastMessage$.next({
                type: 'success',
                message: 'Approval successful – You can now send / trade this token!',
                duration: 'long'
            });

            this.approvalInteraction$.next(true);
            this.loadingIndicatorServ.off();
        }
        catch (error) {
            this.toasterServ.toastMessage$.next({
                type: 'danger',
                message: 'Token approval failed!',
                duration: 'long'
            });
            console.log('Approval aborted', error);

            this.loadingIndicatorServ.off();
        }
    }

    isValidPassword(box: Box, password: string): boolean {
        let sha3 = win.Web3.utils.soliditySha3;
        return box.passHashHash === sha3(sha3(password));
    }

    async createBox(boxInputs: BoxInputs): Promise<void> {

        let passHashHash = win.Web3.utils.soliditySha3(
            win.Web3.utils.soliditySha3(boxInputs.password)
        );

        let sendTokenData = await this.getTokenData(boxInputs.sendTokenAddress);
        let sendWei = this.decimalToWei(
            boxInputs.sendDecimalValue,
            sendTokenData.decimals);

        let requestTokenData = await this.getTokenData(boxInputs.requestTokenAddress);
        let requestWei = this.decimalToWei(
            boxInputs.requestDecimalValue,
            requestTokenData.decimals);

        let baseTokenWei = ZERO;
        if (boxInputs.sendTokenAddress == ADDRESS_ZERO) {
            baseTokenWei = sendWei;
        }

        this.loadingIndicatorServ.on();
        this.ethboxContract.methods
            .createBox(
                boxInputs.recipient,
                boxInputs.sendTokenAddress,
                sendWei,
                boxInputs.requestTokenAddress,
                requestWei,
                passHashHash)
            .send({
                from: this.selectedAccount$.getValue(),
                value: baseTokenWei
            })
            .on('transactionHash', hash =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'secondary',
                        message: 'Waiting for transaction to confirm (may take a while, depending on network load)...',
                        duration: 'short'
                    });
                }))
            .on('receipt', receipt =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'success',
                        message: 'Your outgoing transaction has been confirmed!',
                        duration: 'long'
                    });

                    this.boxInteraction$.next(true);
                    this.loadingIndicatorServ.off();
                }))
            .on('error', (error, receipt) =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'danger',
                        message: 'Sending aborted by user.',
                        duration: 'long'
                    });
                    console.log('Box creation aborted', error, receipt);

                    this.loadingIndicatorServ.off();
                }));
    }

    async getIncomingBoxes(): Promise<Box[]> {

        let incomingBoxesIndices = await this.ethboxContract.methods.getBoxesIncoming()
            .call({ from: this.selectedAccount$.getValue() });
        
        let incomingBoxes = [];
        for (let index of incomingBoxesIndices) {
            
            let box = await this.getBox(index);
            
            incomingBoxes.push({
                passHashHash: box.passHashHash,
                recipient: box.recipient,
                requestToken: box.requestToken,
                requestValue: box.requestValue,
                sendToken: box.sendToken,
                sendValue: box.sendValue,
                sender: box.sender,
                taken: box.taken,
                timestamp: box.timestamp * 1e3,
                index
            });
        }

        // Sort boxes by date from newest to oldest
        incomingBoxes.sort((a, b) => {
            return b.timestamp - a.timestamp;
        });

        return incomingBoxes;
    }

    async getOutgoingBoxes(): Promise<Box[]> {
     
        let outgoingBoxesIndices = await this.ethboxContract.methods
            .getBoxesOutgoing()
            .call({ from: this.selectedAccount$.getValue() });
        
        let outgoingBoxes = [];
        for (let index of outgoingBoxesIndices) {

            let box = await this.getBox(index);

            outgoingBoxes.push({
                passHashHash: box.passHashHash,
                recipient: box.recipient,
                requestToken: box.requestToken,
                requestValue: box.requestValue,
                sendToken: box.sendToken,
                sendValue: box.sendValue,
                sender: box.sender,
                taken: box.taken,
                timestamp: box.timestamp * 1e3,
                index
            });
        }

        // Sort boxes by date from newest to oldest
        outgoingBoxes.sort((a, b) => {
            return b.timestamp - a.timestamp;
        });

        return outgoingBoxes;
    }

    async cancelBox(boxIndex: number): Promise<void> {

        this.loadingIndicatorServ.on();
        this.ethboxContract.methods
            .cancelBox(boxIndex)
            .send({
                from: this.selectedAccount$.getValue(),
                value: ZERO
            })
            .on('transactionHash', hash =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'secondary',
                        message: 'Waiting for transaction to confirm (may take a while, depending on network load)...',
                        duration: 'short'
                    });
                }))
            .on('receipt', receipt =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'success',
                        message: 'Cancelling transaction successful!',
                        duration: 'long'
                    });

                    this.boxInteraction$.next(true);
                    this.loadingIndicatorServ.off();
                }))
            .on('error', (error, receipt) =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'danger',
                        message: 'Cancelling transaction aborted by user.',
                        duration: 'long'
                    });
                    console.log('Box cancellation aborted', error, receipt);

                    this.loadingIndicatorServ.off();
                }));
    }

    async acceptBox(box: Box, password: string): Promise<void> {

        let selectedAccount = this.selectedAccount$.getValue();
        let passHash = win.Web3.utils.soliditySha3(password);

        // If the requestedToken is the base token, then there's no need to approve
        let baseTokenAmount = ZERO;
        if (box.requestToken == ADDRESS_ZERO) {
            baseTokenAmount = box.requestValue;
        }
        else {

            // Getting the user balance of the requestedToken
            let tokenBalance = await this.getTokenBalance(box.requestToken);

            // If the balance is not enough, then rejects the operation
            if ((new BigNumber(box.requestValue)).gt(tokenBalance.wei)) {

                this.toasterServ.toastMessage$.next({
                    type: 'danger',
                    message: `Your have ${tokenBalance.decimalValue} ${box.requestTokenInfo.symbol}, not enough for the exchange.`,
                    duration: 'long'
                });
                return;
            }

            // If the allowance is not enough, then asks for the approval
            if ((new BigNumber(box.requestValue)).gt(tokenBalance.weiAllowance)) {
            
                let isConfirmed = await this.confirmDialogServ.spawn({
                    dialogName: 'Do you want to approve?',
                    message: 'To accept the exchange you need to approve the requested token first. The approval is required only once per token.<br><span class="fw-bold">Do you want to approve?<span>',
                    confirmButtonName: 'Approve'
                });

                // Confirm dialog dismissed
                if (!isConfirmed) {
                    return;
                }

                await this.approveMax(box.requestToken);
                // Stopping here, the user has to click again (clearer from UX perspective)
                return;
            }
        }

        this.loadingIndicatorServ.on();
        this.ethboxContract.methods
            .clearBox(box.index, passHash)
            .send({
                from: selectedAccount,
                value: baseTokenAmount
            })
            .on('transactionHash', hash =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'secondary',
                        message: 'Waiting for transaction to confirm (may take a while, depending on network load)...',
                        duration: 'short'
                    });
                }))
            .on('receipt', receipt =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'success',
                        message: 'The box has been accepted!',
                        duration: 'long'
                    });

                    this.boxInteraction$.next(true);
                    this.loadingIndicatorServ.off();
                }))
            .on('error', (error, receipt) =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'danger',
                        message: 'Box approval aborted. Details in the console',
                        duration: 'long'
                    });
                    console.log('Box approval aborted', error, receipt);

                    this.loadingIndicatorServ.off();
                }));
    }

    signMessage(message) {

        let selectedAccount = this.selectedAccount$.getValue();

        return new Promise((resolve, reject) => {
            this.provider.sendAsync({
                method: 'personal_sign',
                params: [message, selectedAccount],
                from: selectedAccount
            }, (error, response) => {

                if (error) {
                    this.toasterServ.toastMessage$.next({
                        type: 'danger',
                        message: 'Sign of message aborted. Details in the console',
                        duration: 'long'
                    });
                    console.log('Sign of message aborted', error);
                    reject(error);
                }
                resolve(response);

            });
        });
    }

    async getRewardAmount() {

        let result = await this.stakingContract.methods
            .getUnclaimedReward()
            .call({ from: this.selectedAccount$.getValue() });
        return win.Web3.utils.fromWei(result);
    }

    claimReward() {

        this.loadingIndicatorServ.on();
        this.stakingContract.methods
            .claimReward()
            .send({
                from: this.selectedAccount$.getValue()
            })
            .on('transactionHash', hash =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'secondary',
                        message: 'Waiting for transaction to confirm (may take a while, depending on network load)...',
                        duration: 'short'
                    });
                }))
            .on('receipt', receipt =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'success',
                        message: 'Reward has been claimed!',
                        duration: 'long'
                    });

                    this.stakingInteraction$.next(true);
                    this.loadingIndicatorServ.off();
                }))
            .on('error', (error, receipt) =>
                this.ngZone.run(() => {

                    this.toasterServ.toastMessage$.next({
                        type: 'danger',
                        message: 'Reward claiming aborted. Details in the console',
                        duration: 'long'
                    });
                    console.log('Reward claiming aborted', error, receipt);

                    this.loadingIndicatorServ.off();
                }));
    }

}
