import { Component, OnInit, ViewChild } from '@angular/core';
import { LoadingIndicatorService } from 'src/app/services/loading-indicator.service';
import { ContractService } from '../../services/contract.service';
import { ADDRESS_ZERO, ZERO } from '../../constants/various';
import BigNumber from 'bignumber.js';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.css'],
})
export class SendComponent implements OnInit {
  @ViewChild('recipientInput') recipientInput;
  @ViewChild('passwordInput') passphraseInput;
  @ViewChild('sendValueInput') sendAmountInput;

  isAdvancedUser = JSON.parse(localStorage.getItem('isAdvancedUser')) || false;
  keepInputs =
    JSON.parse(localStorage.getItem('shouldSendKeepInputs')) || false;

  isPrivacyEnabled = false;
  password = '';
  recipient;
  sendTokenSelected;
  sendTokenBalance;
  sendValue;

  chainId;
  isChainSupported;
  selectedAccount;
  isAppReady;

  isButtonDisabled = true;
  buttonFunction;
  buttonMessage;

  recipientInputText;
  recipientInputColor = 'text-muted';
  sendValueInputText;
  sendValueInputColor = 'text-muted';

  private subscriptions = [];

  constructor(
    public contractServ: ContractService,
    public loadingIndicatorServ: LoadingIndicatorService,
    private _ActivatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    // Setting up the reactive code to load and reload boxes
    [
      this.contractServ.chainId$,
      this.contractServ.isChainSupported$,
      this.contractServ.selectedAccount$,
      this.contractServ.isAppReady$,
      this.contractServ.boxInteraction$,
      this.contractServ.approvalInteraction$,
    ].forEach((obs) =>
      this.subscriptions.push(
        obs.subscribe(() => this.syncButtonFunctionality())
      )
    );
    // created this method which basically get the params from url
    this.getURLParameters();
  }

  ngOnDestroy() {
    // When the component gets destroyed unsubscribe from everything to prevent memory leaks
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  setAdvancedUser() {
    this.isAdvancedUser = !this.isAdvancedUser;
    localStorage.setItem('isAdvancedUser', JSON.stringify(this.isAdvancedUser));
  }

  setKeepInputs(checkbox) {
    this.keepInputs = checkbox.checked;
    localStorage.setItem(
      'shouldSendKeepInputs',
      JSON.stringify(checkbox.checked)
    );
  }

  // This is where the button gets its text and functionality updated
  syncButtonFunctionality() {
    // Updating local variables
    this.chainId = this.contractServ.chainId$.getValue();
    this.isChainSupported = this.contractServ.isChainSupported$.getValue();
    this.selectedAccount = this.contractServ.selectedAccount$.getValue();
    this.isAppReady = this.contractServ.isAppReady$.getValue();

    // Calculating a message for the user
    if (!this.chainId || !this.selectedAccount) {
      this.buttonMessage = 'Please connect your wallet first!';
      this.buttonFunction = () => this.contractServ.connect();
      this.isButtonDisabled = false;
      return;
    }
    if (!this.isChainSupported) {
      this.buttonMessage =
        'Wrong network – Please use Ethereum, BSC or Polygon!';
      this.isButtonDisabled = true;
      return;
    }
    if (!this.isAppReady) {
      this.buttonMessage = 'Initializing ethbox smart contract...';
      this.isButtonDisabled = true;
      return;
    }

    // About the passphrase
    // First on top because it's NON mandatory
    let { score: passStrength } = (<any>window).zxcvbn(this.password);
    Array.from(document.querySelectorAll('.pass-rect-strength')).forEach(
      (e, i) => {
        if (!this.password || i > passStrength) {
          e.classList.add('d-none');
        } else {
          e.classList.remove('d-none');
        }
      }
    );

    // About the recipient
    if (!this.recipient) {
      this.recipientInputColor = 'text-warning';
      this.recipientInputText = 'Recipient is required';

      this.buttonMessage = 'Recipient is required';
      this.isButtonDisabled = true;
      return;
    }
    if (!this.contractServ.isValidAddress(this.recipient)) {
      this.recipientInputColor = 'text-danger';
      this.recipientInputText = 'Recipient is invalid';

      this.buttonMessage = 'Recipient is invalid';
      this.isButtonDisabled = true;
      return;
    }
    // Recipient tests are passed
    this.recipientInputText = null;
    // Showing a message for self-boxes
    if (this.recipient === this.selectedAccount) {
      this.recipientInputColor = 'text-muted';
      this.recipientInputText = 'Recipient is your own address';
    }

    // About the send token
    if (!this.sendTokenSelected) {
      this.sendValueInputColor = 'text-warning';
      this.sendValueInputText = 'Choose a token';

      this.buttonMessage = 'Choose a token';
      this.isButtonDisabled = true;
      return;
    }
    if (this.sendTokenSelected && !this.sendTokenBalance) {
      this.sendValueInputColor = 'text-muted';
      this.sendValueInputText = 'Loading token balance...';

      this.buttonMessage = 'Loading token balance...';
      this.isButtonDisabled = true;
      return;
    }
    // If the token is selected, the balance has been read but the user has not enough allowance
    if (
      (this.sendTokenSelected &&
        this.sendTokenBalance.decimalAllowance == '0') ||
      new BigNumber(this.sendValue).gt(this.sendTokenBalance.decimalAllowance)
    ) {
      this.sendValueInputColor = 'text-warning';
      this.sendValueInputText = `You have to approve ${this.sendTokenSelected.symbol}`;

      this.buttonMessage = `Approve ${this.sendTokenSelected.symbol}`;
      this.buttonFunction = () =>
        this.contractServ.approveMax(this.sendTokenSelected.address);
      this.isButtonDisabled = false;
      return;
    }
    // About the send value
    if (!this.sendValue) {
      this.sendValueInputColor = 'text-warning';
      this.sendValueInputText = 'Send amount is required';

      this.buttonMessage = 'Send amount is required';
      this.isButtonDisabled = true;
      return;
    }
    if (this.isValueInvalid(this.sendValue)) {
      this.sendValueInputColor = 'text-danger';
      this.sendValueInputText = 'Send amount is invalid';

      this.buttonMessage = 'Send amount is invalid';
      this.isButtonDisabled = true;
      return;
    }
    if (this.isValueTooLow(this.sendValue, this.sendTokenSelected.decimals)) {
      this.sendValueInputColor = 'text-danger';
      this.sendValueInputText = 'Send amount is too low';

      this.buttonMessage = 'Send amount is too low';
      this.isButtonDisabled = true;
      return;
    }
    if (
      this.isValueTooHigh(this.sendValue, this.sendTokenBalance.decimalValue)
    ) {
      this.sendValueInputColor = 'text-danger';
      this.sendValueInputText = 'Send amount is too high';

      this.buttonMessage = 'Send amount is too high';
      this.isButtonDisabled = true;
      return;
    }
    // Send Value tests are passed
    this.sendValueInputText = null;

    // All checks are passed
    this.buttonMessage = 'Send';
    this.buttonFunction = () => this.sendBox();
    this.isButtonDisabled = false;
  }

  isValueInvalid(value) {
    return !/^\d*\.?\d+$/.test(value);
  }

  isValueTooLow(value, decimals) {
    let multiplier = 1 + '0'.repeat(decimals);
    let lowestAllowedDecimal = new BigNumber(1).dividedBy(multiplier);
    return new BigNumber(value).lt(lowestAllowedDecimal);
  }

  isValueTooHigh(value, decimalValue) {
    return new BigNumber(value).gt(decimalValue);
  }

  async sendBox() {
    console.log('Privacy is', this.isPrivacyEnabled);
    console.log('Passphrase is', this.password);
    console.log('Recipient is', this.recipient);
    console.log('Send token address is', this.sendTokenSelected.address);
    console.log('Send amount is', this.sendValue);

    try {
      let receipt;
      if (this.isPrivacyEnabled) {
        let receipt = await this.contractServ.createBoxWithPrivacy({
          password: this.password,
          recipient: this.recipient,
          sender: this.contractServ.selectedAccount$.getValue(),
          sendTokenAddress: this.sendTokenSelected.address,
          sendDecimalValue: this.sendValue,
          requestTokenAddress: ADDRESS_ZERO,
          requestDecimalValue: ZERO,
        });
        return;
      } else {
        let receipt = await this.contractServ.createBox({
          password: this.password,
          recipient: this.recipient,
          sender: this.contractServ.selectedAccount$.getValue(),
          sendTokenAddress: this.sendTokenSelected.address,
          sendDecimalValue: this.sendValue,
          requestTokenAddress: ADDRESS_ZERO,
          requestDecimalValue: ZERO,
        });
      }

      // Clean the inputs if keepInputs is false
      if (!this.keepInputs) {
        // To reset the inputs and everything tied to those I have to:
        // 1. Reset the nativeElement value
        // 2. Dispatch an input event
        [
          this.recipientInput.nativeElement,
          this.passphraseInput.nativeElement,
          this.sendAmountInput.nativeElement,
        ].forEach((e) => {
          e.value = '';
          e.dispatchEvent(
            new Event('input', { bubbles: true, cancelable: true })
          );
        });
      }
    } catch (e) {
      // NOP because the error is already shown to the user by the toaster
    }
  }
  getURLParameters() {
    this._ActivatedRoute.queryParamMap.subscribe((response: any) => {
      setTimeout(() => {
        // only add value if url paramter has value
        if (response.params.recipient!==undefined){
            this.recipientInput.nativeElement.value = response.params.recipient;
        }
        if (response.params.passphrase!==undefined){
            this.passphraseInput.nativeElement.value = response.params.passphrase;
        }
        if (response.params.amount!==undefined){
            this.sendAmountInput.nativeElement.value = response.params.amount;
        }
        if (response.params.symbol!==undefined){
            this.sendTokenSelected = response.params.symbol;
        }
        
        if (response.params.privacy==="true") {
            this.isPrivacyEnabled = true;
        }else{
            this.isPrivacyEnabled = false;
        }
        if (response.params.keep==="true") {
            this.keepInputs = true;
        }else{
            this.keepInputs = false;
        }
      }, 1000);
    });
  }
}
