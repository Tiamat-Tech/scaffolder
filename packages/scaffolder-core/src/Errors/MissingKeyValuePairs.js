const { error, boldGreen } = require('../cliHelpers/colors');


const extractKey = k => k.replace(/({|})/g, '');

export class MissingKeyValuePairs extends Error {
	constructor(key) {
		super();
		this.key = key;
	}

	getDisplayErrorMessage() {
		const message = `${error(
			`Error There is no value matching the key ${boldGreen(this.key)}`
		)}.\nYou can pass key value pairs like so key1=value1 key2=value2 etc...\nFor this specific case you should pass the following in the console ${boldGreen(
			extractKey(`${this.key}=<someValue>`)
		)}.`;
		return message;
	}

	get name() {
		return 'MissingKeyValuePairs';
	}
}

