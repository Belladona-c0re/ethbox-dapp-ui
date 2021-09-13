import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ContractService } from '../../services/contract.service';
import { AddressBookService } from 'src/app/services/address-book.service';

@Component({
    selector: 'app-boxes-received-list',
    templateUrl: './boxes-received-list.component.html',
    styleUrls: ['./boxes-received-list.component.css']
})
export class BoxesReceivedListComponent implements OnInit, OnDestroy {

    paginatedBoxes = null;
    paginationText = '0-0 / 0';
    
    order = 'desc';
    state;
    type;
    
    chainId;
    isChainSupported;
    selectedAccount;
    isAppReady;
    message;

    private subscriptions = [];

    private pageIndex = 0;
    private pageSize = 15;
    
    private fetchedBoxes;
    private filteredBoxes;

    private addressBookMap;
    
    constructor(
        public contractServ: ContractService,
        private ngZone: NgZone,
        private addressBookServ: AddressBookService) { }

    ngOnInit() {

        // Setting up the reactive code to show some messages to the user and eventually load the boxes into the component
        [
            this.contractServ.chainId$,
            this.contractServ.isChainSupported$,
            this.contractServ.selectedAccount$,
            this.contractServ.isAppReady$,
            this.contractServ.boxInteraction$,
            this.contractServ.incomingBoxes$
        ].forEach(obs => 
            this.subscriptions.push(
                obs.subscribe(() => {

                    // Resetting the component
                    this.paginatedBoxes = null;
                    this.filteredBoxes = null;
                    this.fetchedBoxes = null;

                    // Updating local variables
                    this.chainId = this.contractServ.chainId$.getValue();
                    this.isChainSupported = this.contractServ.isChainSupported$.getValue();
                    this.selectedAccount = this.contractServ.selectedAccount$.getValue();
                    this.isAppReady = this.contractServ.isAppReady$.getValue();

                    // Calculating a message for the user
                    if (!this.chainId || !this.selectedAccount) {
                        this.message = 'Please connect your wallet first!';
                        return;
                    }
                    if (!this.isChainSupported) {
                        this.message = 'Wrong network – Please use Ethereum, BSC or Polygon!';
                        return;
                    }
                    if (!this.isAppReady) {
                        this.message = 'Initializing ethbox smart contract...';
                        return;
                    }

                    this.message = 'Loading...';

                    // Get boxes and the address book
                    let boxes = this.contractServ.incomingBoxes$.getValue();
                    this.addressBookMap = this.addressBookServ.getAddressesMap();

                    if (!boxes) {
                        return;
                    }

                    if (boxes.length === 0) {
                        this.message = 'No incoming transactions!';
                        return;
                    }

                    this.fetchedBoxes = boxes
                        .map(box => ({
                            addressBookName: this.addressBookMap[box.recipient],
                            ...box
                        }));
                    
                    this.filterBoxes();
                })));
    }

    ngOnDestroy() {

        // When the component gets destroyed unsubscribe from everything to prevent memory leaks
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    onPaginationPreviousClick() {

        if (this.pageIndex < 1) {
            return;
        }
        this.pageIndex--;
        this.updatePagination();
    }

    onPaginationNextClick() {

        if (this.pageIndex * this.pageSize + this.pageSize > this.filteredBoxes.length - 1) {
            return;
        }
        this.pageIndex++;
        this.updatePagination();
    }

    async updatePagination() {

        let start = this.pageIndex * this.pageSize,
            end = this.pageIndex * this.pageSize + this.pageSize;
        if (end > this.filteredBoxes.length) {
            end = this.filteredBoxes.length;
        }
        this.paginationText = `${start + 1}-${end} / ${this.filteredBoxes.length}`;
        let boxesInView = this.filteredBoxes.slice(start, end);

        // For performance is better to enrich boxes here (just those boxes in the view)
        for (let box of boxesInView) {

            box.readableTimestamp = new Date(box.timestamp)
                .toLocaleDateString(
                    undefined, // Fallbacks to the user's locale
                    {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }
                );

            box.sendTokenInfo = await this.contractServ.getTokenData(box.sendToken);
            box.sendDecimalValue = this.contractServ.weiToDecimal(
                box.sendValue,
                box.sendTokenInfo.decimals);
            
            if (box.requestToken) {
                box.requestTokenInfo = await this.contractServ.getTokenData(box.requestToken);
                box.requestDecimalValue = this.contractServ.weiToDecimal(
                    box.requestValue,
                    box.requestTokenInfo.decimals);
            } else {
                box.requestValue = '0';
            }
        }

        this.message = null; // Remove "Loading..." message

        this.paginatedBoxes = boxesInView;
    }

    filterBoxes() {

        if (!this.fetchedBoxes) {
            return;
        }

        this.filteredBoxes = this.fetchedBoxes
            .filter(box =>
                !this.state || box.taken == (this.state == 'completed'))
            .filter(box =>
                !this.type || box.requestValue === '0' == (this.type == 'withdraw'));

        if (this.order) {
            this.filteredBoxes.sort((a, b) =>
                this.order == 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp);
        }

        this.pageIndex = 0;
        this.updatePagination();
    }

    // This piece of code tells Angular how to track boxes efficiently, when and where to touch the DOM
    identifier(index, box) {
        return `${box.sender}-${box.recipient}-${box.taken}-${box.timestamp}`;
    }
}
