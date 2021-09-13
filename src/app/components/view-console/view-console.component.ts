import { Component, OnInit, ViewChild } from '@angular/core';
import { ViewConsoleService } from 'src/app/services/view-console.service';

@Component({
    selector: 'app-view-console',
    templateUrl: './view-console.component.html',
    styleUrls: ['./view-console.component.css']
})
export class ViewConsoleComponent implements OnInit {

    @ViewChild("consoleOpeningCheckbox") consoleOpeningCheckbox;

    messages;

    consoleShowState = JSON.parse(localStorage.getItem("consoleShowState")) || false;

    constructor(private viewConsoleServ: ViewConsoleService) { }

    ngOnInit(): void {
        this.messages = this.viewConsoleServ.messages;
        // setInterval(() => this.viewConsoleServ.log("I like ice cream"), 1000);
    }

    ngAfterViewInit() {
        // Show the console if the consoleShowState is true
        if (this.consoleShowState) {
            this.consoleOpeningCheckbox.nativeElement.checked = true;
        }
    }

    setConsoleShowState(checkbox) {
        localStorage.setItem(
            "consoleShowState",
            JSON.stringify(checkbox.checked)
        );
    }

}
