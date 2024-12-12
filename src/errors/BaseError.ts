export class BaseError extends Error {
    public readonly name: string;
    public readonly message: string;
    public readonly stack?: string;

    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}