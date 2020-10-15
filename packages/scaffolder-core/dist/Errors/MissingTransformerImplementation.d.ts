export class MissingTransformerImplementation extends Error {
    constructor({ transformationKey }: {
        transformationKey: any;
    });
    transformationKey: any;
    getDisplayErrorMessage(): string;
}
