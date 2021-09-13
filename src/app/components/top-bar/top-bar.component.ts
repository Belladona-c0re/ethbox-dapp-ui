import { Component } from '@angular/core';
import { ContractService } from '../../services/contract.service';

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent {

    isMenuUntouched = true;
    areThereIncomingBoxes = false;
    wasIncomingTouched = false;

    constructor(public contractServ: ContractService) {
        this.contractServ.incomingBoxes$
            .subscribe(boxes => {

                // This piece of code lights up a red dot on the button "Incoming" if there are incoming boxes that are not yet taken
                if (!boxes || boxes.length == 0 || boxes.every(box => box.taken)) {
                    this.areThereIncomingBoxes = false;
                    return;
                }
                this.areThereIncomingBoxes = true;

            });
    }

}
