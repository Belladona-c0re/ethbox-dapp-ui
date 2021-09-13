import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AddressBookService } from 'src/app/services/address-book.service';
import { ContractService } from 'src/app/services/contract.service';
import { LoadingIndicatorService } from 'src/app/services/loading-indicator.service';

@Component({
    selector: 'app-address-book',
    templateUrl: './address-book.component.html',
    styleUrls: ['./address-book.component.css']
})
export class AddressBookComponent implements OnInit {

    @Output() onAddressSelected = new EventEmitter();

    randomId = `address-book_${Math.random().toString(36).substring(2)}`;
    name = '';
    address = '';
    search = '';
    addresses;
    filteredAddresses;

    constructor(
        public loadingIndicatorServ: LoadingIndicatorService,
        public contractServ: ContractService,
        private addressBookServ: AddressBookService) { }

    ngOnInit() {

        this.addresses = this.addressBookServ.getAddressesFromLS();
        this.filteredAddresses = this.addresses;
    }

    ngAfterViewInit() {

        // Moves the modal to the body (backdrop hackfix)
        let modal = document.getElementById(this.randomId);
        document.body.appendChild(modal);
    }

    ngOnDestroy() {

        // Removes the modal from the body (backdrop hackfix)
        document.getElementById(this.randomId).remove();
    }

    onAddClicked() {

        let addresses = this.addressBookServ.addAddress(this.name, this.address);
        if (addresses) {
            this.addresses = addresses;
            this.name = null;
            this.address = null;
            this.filterAddresses();
        }
    }

    onDelClicked(address) {

        let addresses = this.addressBookServ.removeAddress(address);
        if (addresses) {
            this.addresses = addresses;
            this.filterAddresses();
        }
    }

    filterAddresses() {

        this.filteredAddresses = this.addresses
            .filter(addr => {

                let lcSearch = this.search.trim().toLowerCase();
                let lcLabel = addr.label.toLowerCase();
                let lcAddress = addr.address.toLowerCase();
                return !this.search || lcLabel.includes(lcSearch) || lcAddress.includes(lcSearch);
            });
    }

}
