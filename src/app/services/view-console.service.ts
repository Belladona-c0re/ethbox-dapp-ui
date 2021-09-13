import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class ViewConsoleService {

	public messages: { type: "info"|"warn"|"err", timestamp: Number | String, message: String }[] = [];

	constructor() { }

	log(message) {
		this.messages.push({ type: "info", timestamp: Date.now(), message });
	}

	warning(message) {
		this.messages.push({ type: "warn", timestamp: Date.now(), message });
	}

	error(message) {
		this.messages.push({ type: "err", timestamp: Date.now(), message });
	}
}
