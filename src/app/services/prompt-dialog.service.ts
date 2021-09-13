import { Injectable } from '@angular/core';
import { PromptOptions } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class PromptDialogService {

    transitionDelay = 250;

    constructor() { }

    spawn({ dialogName, message, messageColor, inputs, submitButtonName, cancelButtonName }: PromptOptions) {

        if (!message) {
            throw new Error('Message is required.');
        }

        if (!inputs || Object.keys(inputs).length < 1) {
            throw new Error('At least an input is required.');
        }

        // Some defaults
        dialogName = dialogName || 'Please enter the values';
        submitButtonName = submitButtonName || 'Submit';
        cancelButtonName = 'Cancel';

        // The id is used to generate a unique dialog and to retrieve it during the removal
        let randomId = Math.random().toString(36).substring(2);

        // Making the dialog
        let newEl = document.createElement('div');
        newEl.innerHTML = this.getTemplate(randomId, dialogName, message, messageColor, inputs, submitButtonName, cancelButtonName);
        let dialogWrapper: any = newEl.firstElementChild;
        let dialog = dialogWrapper.firstElementChild;

        // This is so I can code the click-outside-to-close feature
        dialog.addEventListener('click', evt => evt.stopPropagation());

        // Appending the dialog
        document.body.appendChild(dialogWrapper);
        setTimeout(() => {
            dialogWrapper.style.opacity = '1';
            dialog.style.opacity = '1';
            document.body.style.overflow = 'hidden';
        }, 25);


        // Making a promise that will resolve on button clicked
        let resolve;
        let closePromise = new Promise(_resolve => {
            // Saving the reference so it can be used outside
            resolve = _resolve;
        });

        // Attaching to the window the callback for the buttons
        window[`promptInputs${randomId}`] = inputs;
        window[`onPrompt${randomId}`] = data => {
            resolve(data);
            // Deleting the prompt related stuff from the window
            delete window[`promptInputs${randomId}`];
            delete window[`onPrompt${randomId}`];
            // Removing the dialog
            let dialogWrapper: any = document.querySelector(`#prompt_${randomId}`);
            let dialog = dialogWrapper.firstElementChild;
            dialogWrapper.style.opacity = '0';
            dialog.style.opacity = '0';
            setTimeout(() => {
                dialogWrapper.remove();
                document.body.style.overflow = 'visible';
            }, this.transitionDelay);
        };

        return closePromise;
    }

    private getTemplate(id, dialogName, message, messageColor = 'dark', inputs, submitButtonName, cancelButtonName) {

        let inputsTemplate = Object.entries<any>(inputs)
            .reduce((result, [fieldName, { type, label, value }]) => {
                result += this.getInputTemplate(id, type, fieldName, label, value);
                return result;
            }, '');

        return `
        <div id="prompt_${id}" class="d-flex align-items-center justify-content-center position-fixed p-3" style="opacity: 0; top: 0; left: 0; bottom: 0; right: 0; background-color: rgba(0, 0, 0, .5); z-index: 1669; transition: all ${this.transitionDelay}ms ease-out" onclick="onPrompt${id}(null)">
            <div class="bg-white container-small rounded-alot" style="opacity: 0; z-index: 1670; transition: all ${this.transitionDelay}ms ease-out">
                <header class="d-flex align-items-center p-3 border-bottom">
                    <div class="fs-5 me-auto">${dialogName}</div>
                    <button onclick="onPrompt${id}(null)" class="btn-close"></button>
                </header>
                <div class="p-3 pb-0">
                    <p class="text-${messageColor}">${message}</p>
                    ${inputsTemplate}
                </div>
                <footer class="p-3 border-top text-end">
                    <button onclick="onPrompt${id}(null)" class="btn btn-outline-eboxprimary rounded-alot me-2">${cancelButtonName}</button>
                    <button onclick="onPrompt${id}(window.promptInputs${id})" class="btn btn-eboxprimary rounded-alot">${submitButtonName}</button>
                </footer>
            </div>
        </div>`;
    }

    private getInputTemplate(id, type = 'text', fieldName, label, value = '') {
        return `
            <div class="form-floating mb-3">
                <input type="${type}" class="form-control rounded-alot" value="${value}" placeholder="${label}" oninput="promptInputs${id}['${fieldName}'].value = this.value">
                <label>${label}</label>
            </div>`;
    }
}
