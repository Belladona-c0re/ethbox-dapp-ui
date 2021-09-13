import { EventEmitter, NgZone } from '@angular/core';
import { AfterViewInit, Component, OnDestroy, OnInit, Output, Input } from '@angular/core';
import { ContractService } from '../../services/contract.service';
import { SmartInterval } from '../../../assets/js/custom-utils';
import { PromptDialogService } from 'src/app/services/prompt-dialog.service';
import { ToasterService } from 'src/app/services/toaster.service';
import { LoadingIndicatorService } from 'src/app/services/loading-indicator.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-token-selector',
    templateUrl: './token-selector.component.html',
    styleUrls: ['./token-selector.component.css']
})
export class TokenSelectorComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() isBalanceEnabled = true;
    @Output() onTokenSelected = new EventEmitter();
    @Output() onTokenBalanceUpdated = new EventEmitter();

    randomId = `modal_${Math.random().toString(36).substring(2)}`;
    tokens;
    filteredTokens;
    selectedToken;
    selectedTokenBalance;

    private maxToShow = 60;
    private isBalanceLoading = false;
    private balancePollingCycleDelay = 6e3;
    private balancePollingStartDelay = 0;
    private balancePollingLoop;
    private subscription;

    constructor(
        public loadingIndicatorServ: LoadingIndicatorService,
        private contractServ: ContractService,
        private ngZone: NgZone,
        private promptDialogServ: PromptDialogService,
        private _ActivatedRoute: ActivatedRoute,
        private toasterServ: ToasterService) { }

    ngOnInit() {
        // This loop calls getTokenBalance(), waits for the result and then repeats
        // This polling loop never starts if isBalanceEnabled is set to false by the host component
        this.balancePollingLoop = new SmartInterval(
            async () => {

                let balance = await this.contractServ
                    .getTokenBalance(this.selectedToken.address);

                this.ngZone.run(() => {
                    this.selectedTokenBalance = balance;
                    this.onTokenBalanceUpdated.emit(balance);
                    console.log('Selected token balance', balance);

                    this.isBalanceLoading = false;
                });
            },
            this.balancePollingCycleDelay,
            this.balancePollingStartDelay);

        this.subscription = this.contractServ.tokens$
            .subscribe(tokens => {
                this.tokens = tokens;

                this.filteredTokens = null;
                this.selectedToken = null;
                this.onTokenSelected.emit(null);

                this.balancePollingLoop.stop();
                this.selectedTokenBalance = null;
                this.onTokenBalanceUpdated.emit(null);

                if (tokens) {
                    
                    this._ActivatedRoute.queryParamMap.subscribe((response: any) => {
                        setTimeout(() => {
                          // only add value if url paramter has value
                          // check for symbol getting from URL 
                          if (response.params.symbol!==undefined){
                              let TempToken = this.tokens.filter(x=>x.symbol.toLowerCase() ===response.params.symbol.toLowerCase())[0];
                              this.filteredTokens = tokens.slice(0, this.maxToShow);
                              console.log(this.filteredTokens)
                              this.selectToken(TempToken);        
                          }else{
                            this.filteredTokens = tokens.slice(0, this.maxToShow);
                          }
                        }, 1000);
                      });
                }
            });
            this.getURLParameters();
    }
    getURLParameters() {
        this._ActivatedRoute.queryParamMap.subscribe((response: any) => {
          setTimeout(() => {
            // only add value if url paramter has value
            if (response.params.symbol!==undefined){
                this.selectedToken.symbol = response.params.symbol;

            }
          }, 1000);
        });
      }
    ngAfterViewInit() {

        // Moves the modal to the body (backdrop hackfix)
        let modal = document.getElementById(this.randomId);
        document.body.appendChild(modal);
    }

    ngOnDestroy() {

        // Removes the modal from the body (backdrop hackfix)
        document.getElementById(this.randomId).remove();

        this.subscription.unsubscribe();
        this.balancePollingLoop.stop();
    }

    async selectToken(token) {

        this.selectedToken = token;
        this.onTokenSelected.emit(token);
        console.log('Selected token', token);

        if (this.isBalanceEnabled) {
            this.selectedTokenBalance = null;
            this.onTokenBalanceUpdated.emit(null);
            this.isBalanceLoading = true;
            this.balancePollingLoop.stop();
            this.balancePollingLoop.start();
        }
    }

    filterTokens(search) {

        this.filteredTokens = this.tokens
            .filter(token => {

                let trimmed = search.trim();
                let lcSearch = trimmed.toLowerCase();
                let lcName = token.name.toLowerCase();
                let lcSymbol = token.symbol.toLowerCase();
                let lcAddress = token.address.toLowerCase();
                return !search || lcName.includes(lcSearch) || lcSymbol.includes(lcSearch) || lcAddress.includes(lcSearch);
            })
            .slice(0, this.maxToShow);
    }

    identifier(index, token) {
        return token.address;
    }

    async customTokenPrompt() {

        let response: any = await this.promptDialogServ.spawn({
            dialogName: 'Add a new custom token',
            message: 'Specify a valid token contract to add the new token',
            inputs: {
                address: {
                    label: 'Insert token address'
                }
            },
            submitButtonName: 'Add',
            cancelButtonName: 'Cancel'
        });

        // While token address is set but invalid or already present keep spawning
        while (response !== null 
            && (
                !this.contractServ.isValidAddress(response.address.value) 
                || this.contractServ.tokensMap[response.address.value])) {

            response = await this.promptDialogServ.spawn({
                dialogName: 'Add a new custom token',
                message: 'Specified token address ' +
                    ((this.contractServ.tokensMap[response.address.value])
                        ? 'is already present, try another'
                        : 'was invalid, try again'),
                messageColor: 'danger',
                inputs: {
                    address: {
                        label: 'Insert token address'
                    }
                },
                submitButtonName: 'Add',
                cancelButtonName: 'Cancel'
            });
        }

        if (response === null) {
            return;
        }

        let tokenData = await this.contractServ.getTokenData(response.address.value);

        if (!tokenData.decimals || !tokenData.name || !tokenData.symbol) {
            this.toasterServ.toastMessage$.next({
                type: 'danger',
                message: 'Some important information of the token is missing!',
                duration: 'long'
            });
            return;
        }

        let LSKey = `customTokens${this.contractServ.chainId$.getValue()}`;
        let customTokens = [];
        let customTokensLS = localStorage.getItem(LSKey);
        if (customTokensLS) {
            customTokens = JSON.parse(customTokensLS);
        }
        customTokens.push({
            address: tokenData.address,
            name: tokenData.name,
            symbol: tokenData.symbol,
            decimals: tokenData.decimals
        });
        localStorage.setItem(LSKey, JSON.stringify(customTokens));
        this.contractServ.loadTokens();

        this.toasterServ.toastMessage$.next({
            type: 'success',
            message: 'The new token has been added successfully!',
            duration: 'long'
        });
    }

}
