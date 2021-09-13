import { Component, Input } from '@angular/core';
import { Box } from 'src/app/interfaces';
import { LoadingIndicatorService } from 'src/app/services/loading-indicator.service';
import { ContractService } from '../../../services/contract.service';

@Component({
    selector: 'app-box-sent',
    templateUrl: './box-sent.component.html',
    styleUrls: ['./box-sent.component.css']
})
export class BoxSentComponent {

    @Input() box: Box;

    isExpanded = false;
    sendTokenBalance;
    requestTokenBalance;

    constructor(
        public contractServ: ContractService,
        public loadingIndicatorServ: LoadingIndicatorService) { }

        async onBoxToggle() {

            this.isExpanded = !this.isExpanded;
    
            // Only updates balances when expanded
            if (this.isExpanded) {
                this.sendTokenBalance = await this.contractServ
                    .getTokenBalance(this.box.sendTokenInfo.address);
                
                if (this.box.requestToken) {
                    this.requestTokenBalance = await this.contractServ
                        .getTokenBalance(this.box.requestTokenInfo.address);
                }
                
                console.log('send token balance', this.sendTokenBalance);
                console.log('request token balance', this.requestTokenBalance);
            }
        }

}
