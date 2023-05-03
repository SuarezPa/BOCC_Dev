export class DataFriendlyError extends Error {

    constructor(message: string) {
        super();

        this.message = message;
    }

}

export class InternalServerError extends Error {
    
}