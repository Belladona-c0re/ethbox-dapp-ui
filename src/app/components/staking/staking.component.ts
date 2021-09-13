import { Component, OnDestroy, OnInit } from '@angular/core';
import { ContractService } from 'src/app/services/contract.service';
import { StakingService } from 'src/app/services/staking.service';
import { ToasterService } from 'src/app/services/toaster.service';

@Component({
    selector: 'app-staking',
    templateUrl: './staking.component.html',
    styleUrls: ['./staking.component.css']
})
export class StakingComponent implements OnInit, OnDestroy {

    monthsNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    today = new Date();
    pageMonth;
    pageDate;
    userRewardObjAPI;
    userRewardContract;

    chainId;
    isEthereumMainnet;
    selectedAccount;
    isStakingReady;
    message;

    selectedNetwork = null; // false Ethereum, true BSC

    private numberOfDaysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    private subscriptions = [];
    private minMonth;
    private minDate;
    private maxMonth;
    private maxDate;
    private fetchedRewards;

    constructor(
        public contractServ: ContractService,
        private stakingServ: StakingService,
        private toasterServ: ToasterService) { }

    async ngOnInit() {

        this.pageMonth = this.today.getMonth();
        this.pageDate = this.today.getDate();

        // Setting up the reactive code to load the reward
        [
            this.contractServ.chainId$,
            this.contractServ.selectedAccount$,
            this.contractServ.isStakingReady$,
            this.contractServ.stakingInteraction$
        ].forEach(obs => 
            this.subscriptions.push(
                obs.subscribe(async () => {

                    // Resetting the component
                    this.selectedAccount = null;
                    this.userRewardObjAPI = null;
                    this.userRewardContract = null;

                    // Updating local variables
                    this.chainId = this.contractServ.chainId$.getValue();
                    this.selectedAccount = this.contractServ.selectedAccount$.getValue();
                    this.isStakingReady = this.contractServ.isStakingReady$.getValue();

                    // Calculating a message for the user
                    if (!this.chainId || !this.selectedAccount) {
                        this.message = 'Please connect your wallet first!';
                        return;
                    }
                    if (!this.contractServ.isEthereumMainnet() && !this.contractServ.isBinanceMainnet()) {
                        this.message = 'Please connect to Ethereum mainnet or BSC mainnet.';
                        return;
                    }
                    if (!this.isStakingReady) {
                        this.message = 'Initializing ethbox smart contract...';
                        return;
                    }

                    await this.setSelectedNetwork();

                    // Loading message displayed to the user
                    this.message = 'Loading your reward...';

                    let dateLimits = await this.stakingServ.getDateLimits();

                    this.minMonth = dateLimits.min_month - 1;
                    this.minDate = +dateLimits.min_day;
                    this.maxMonth = dateLimits.max_month - 1;
                    this.maxDate = +dateLimits.max_day;

                    this.pageMonth = this.maxMonth;
                    this.pageDate = this.maxDate;

                    this.userRewardContract = await this.contractServ.getRewardAmount();

                    await this.fetchRewards();
                    if (!this.userRewardObjAPI) {
                        this.message = 'Reward not found';
                        return;
                    }

                    // Selected reward is available
                    this.message = null;
                })));
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    async setSelectedNetwork() {
        let endpoint = "https://www.ethbox.org/app/set_chain.php";
        let selectedAccount = this.contractServ.selectedAccount$.getValue();

        // Send the signed message to the backend
        let formData = new FormData();
        formData.append("action", "get_chain");
        formData.append("address", selectedAccount);

        let response = await fetch(endpoint, { method: 'POST', body: formData });
        let status = await response.json();

        console.log("Status of the request is", status);

        // If error, then return error?

        this.selectedNetwork = !!!status.result;
    }

    async rewardsToChain(checkbox) { // Be careful that the chainIndex is not the chainId

        // There's a bit of confusion here because I want Ethereum on the left and to do that I need to check when the result is 0 (inverted)
        let chainIndex = checkbox.checked ? '0' : '1';

        let endpoint = "https://www.ethbox.org/app/set_chain.php";
        let selectedAccount = this.contractServ.selectedAccount$.getValue();

        let newNetwork = ["Ethereum", "Binance Smart Chain"][chainIndex];

        // Build a magic string as message
        let msg = `ethbox Staking - Set default chain:\r\n${newNetwork}`;

        let result;
        try {
            // Sign the message
            result = (await <any>this.contractServ.signMessage(msg)).result;
        } catch (e) {
            // If sign is refused then revert the checkbox
            checkbox.checked = !checkbox.checked;
            return;
        }

        console.log("Signed message is", result);

        // Send the signed message to the backend
        let formData = new FormData();
        formData.append("action", "set_chain");
        formData.append("address", selectedAccount);
        formData.append("signed_msg", result);
        formData.append("chain", chainIndex);

        let response = await fetch(endpoint, { method: 'POST', body: formData });
        let status = await response.json();

        console.log("Status of the request is", status);

        // Notify, via toaster, the fact that the server has switched the network
        if ("error" in status && status.error === 0) {
            this.toasterServ.toastMessage$.next({
                type: "success",
                message: `Staking rewards have successfully switched to ${newNetwork}!`,
                duration: "medium"
            });
        } else {
            this.toasterServ.toastMessage$.next({
                type: "error",
                message: "Something went wrong.",
                duration: "medium"
            });
            // If there's any problem with the API then revert the checkbox
            checkbox.checked = !checkbox.checked ;
        }
    }

    async onPaginationPreviousClick() {

        if (this.pageDate <= this.minDate && this.pageMonth <= this.minMonth) {
            return;
        }
        if (this.pageDate < 2) {
            if (this.pageMonth == 0) {
                this.pageMonth = this.monthsNames.length - 1;
            }
            else {
                this.pageMonth--;
            }
            this.pageDate = this.numberOfDaysInMonths[this.pageMonth];
        }
        else {
            this.pageDate--;
        }
        await this.fetchRewards();
    }

    async onPaginationNextClick() {

        if (this.pageDate >= this.maxDate && this.pageMonth >= this.maxMonth) {
            return;
        }
        if (this.pageDate == this.numberOfDaysInMonths[this.pageMonth]) {
            if (this.pageMonth == this.monthsNames.length - 1) {
                this.pageMonth = 0;
            }
            else {
                this.pageMonth++;
            }
            this.pageDate = 1;
        }
        else {
            this.pageDate++;
        }
        await this.fetchRewards();
    }

    private async fetchRewards() {

        let results = await this.stakingServ.getData(this.pageMonth, this.pageDate);
        this.fetchedRewards = results
            .map(result => ({ 
                ...result,
                apy: 100 * ((1 + result.reward / result.balance) ** 12 - 1)
            }));

        this.userRewardObjAPI = this.fetchedRewards
            .find(item => item.address.toLowerCase() == this.selectedAccount.toLowerCase());

        console.log(this.userRewardObjAPI);
    }

}
