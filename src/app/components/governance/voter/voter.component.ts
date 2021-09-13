import { Component, Input, OnInit } from '@angular/core';

@Component({
	selector: 'app-voter',
	templateUrl: './voter.component.html',
	styleUrls: ['./voter.component.css']
})
export class VoterComponent implements OnInit {

	@Input() voter;
	@Input() isDetailedView;

	alphabet = "abcdefghijklmnopqrstuvwxyz";

	constructor() { }

	ngOnInit(): void {
	}

}
