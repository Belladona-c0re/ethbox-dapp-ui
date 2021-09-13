export interface TokenData {
    address: string;
    name: string;
    symbol: string;
    decimals: string | number;
    thumb?: string;
    
}

export interface TokenBalance {
    address: string;
    wei: string;
    weiAllowance: string;
    decimalValue: string;
    decimalAllowance: string;
}

export interface Box {
    readonly passHashHash: string;
    readonly recipient: string;
    readonly sender: string;
    readonly timestamp: string;
    readonly sendToken: string;
    readonly sendValue: string
    readonly requestToken: string;
    readonly requestValue: string;
    readonly taken: boolean;
    hasPrivacy?: boolean;
    index?: number;
    addressBookName?: string;
    readableTimestamp?: string;
    sendTokenInfo?: TokenData;
    sendDecimalValue?: string;
    requestTokenInfo?: TokenData;
    requestDecimalValue?: string;
}

export interface BoxInputs {
    password: string;
    recipient: string;
    sender: string;
    sendTokenAddress: string;
    sendDecimalValue: string;
    requestTokenAddress: string;
    requestDecimalValue: string;
}

export interface ToastData {
    type: string;
    message: string;
    duration: string;
}

export interface ConfirmOptions {
    dialogName?: string;
    message: string;
    confirmButtonName?: string;
    cancelButtonName?: string;
}

export interface PromptOptions {
    dialogName?: string;
    message: string;
    messageColor?: string;
    inputs: {
        [key: string]: PromptInput;
    };
    submitButtonName?: string;
    cancelButtonName?: string;
}

export interface PromptInput {
    type?: string;
    label: string;
    value?: string;
}