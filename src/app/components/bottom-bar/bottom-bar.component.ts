import { Component } from '@angular/core';

@Component({
    selector: 'app-bottom-bar',
    templateUrl: './bottom-bar.component.html',
    styleUrls: ['./bottom-bar.component.css']
})
export class BottomBarComponent {

    darkMode = false;

    constructor() { }

    ngOnInit() {
        let _darkMode = JSON.parse(localStorage.getItem("darkMode"));
        if (_darkMode) {
            this.darkMode = _darkMode;
        }
        this.setTheme();
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        localStorage.setItem("darkMode", JSON.stringify(this.darkMode));
        this.setTheme();
    }

    setTheme() {
        let html = document.querySelector("html");
        if (this.darkMode) {
            html.setAttribute("theme", "dark-mode");
        } else {
            html.setAttribute("theme", "light-mode");
        }
    }

}
