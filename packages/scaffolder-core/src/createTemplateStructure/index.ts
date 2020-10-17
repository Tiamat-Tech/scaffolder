import fs from 'fs';
import { NoMatchingTemplate, MissingKeyValuePairs, MissingFunctionImplementation } from '../Errors';
import { isFolder, join, TYPES } from '../filesUtils';
import { applyTransformers } from './applyTransformers';
import { Context } from '../configHelpers/config';
import { readConfig } from '../configHelpers';
import { curry } from 'ramda';



export interface TemplateStructure {
	name: string;
	type?: TYPES;
	content: string | TemplateStructure[];
	[key: string]: any;
}

export const extractKey = (k) => k.replace(/({|})/g, '').trim();


export const isAFunctionKey = (key: string) => /.+\(\)/.test(key);

export const getKeyAndTransformers = (initialKey) =>
	extractKey(initialKey)
		.split('|')
		.map((_) => _.trim());

export const replaceKeyWithValue = (
	keyValuePairs,
	transformersMap,
	functionsMap,
	ctx: Context
) => (match) => {
	if (isAFunctionKey(match)) {
		const functionKey = extractKey(match).replace(/\(|\)/g, '');
		if (!(functionKey in functionsMap)) {
			throw new MissingFunctionImplementation({
				functionKey
			});
		}
		return functionsMap[functionKey](ctx);
	}

	const [key, ...transformersKeys] = getKeyAndTransformers(match);

	if (!(key in keyValuePairs)) {
		throw new MissingKeyValuePairs(match);
	}

	const keyInitialValue = keyValuePairs[key];

	return transformersKeys
		? applyTransformers(keyInitialValue, transformersMap, transformersKeys, ctx)
		: keyInitialValue;
};

export const createTemplateStructure = (folderPath: string): TemplateStructure[] => {
	const folderContent = fs.readdirSync(folderPath);
	return folderContent.map((file) => {
		if (isFolder(folderPath, file)) {
			return {
				type: TYPES.FOLDER,
				name: file,
				content: createTemplateStructure(join(folderPath, file)),
				scaffolderTargetRoot: folderPath,
			};
		}
		return {
			name: file,
			content: fs.readFileSync(join(folderPath, file)).toString(),
			scaffolderTargetRoot: folderPath,
		};
	});
};


export const templateReader = curry((commands,cmd) => {
	if (!commands[cmd]) {
		throw new NoMatchingTemplate(cmd);
	}

	return {
		config: readConfig(commands[cmd]),
		currentCommandTemplate: createTemplateStructure(commands[cmd]),
	};
});


export const templateTransformer = (templateDescriptor: TemplateStructure[], injector, globalCtx) => {
	const createLocalCtx = ({ type = 'FILE', scaffolderTargetRoot, name }) => {
		const currentFileLocationPath = scaffolderTargetRoot
			.split('scaffolder')
			.pop();
		const currentFilePath = `${globalCtx.targetRoot}${currentFileLocationPath}`;
		return {
			fileName: name, type, currentFilePath
		};
	};

	const transformFile = (descriptor) => ({
		name: injector(
			descriptor.name,
			createLocalCtx({
				...descriptor, type: TYPES.FILE_NAME
			})
		),
		content: injector(
			descriptor.content,
			createLocalCtx({
				...descriptor, type: TYPES.FILE_CONTENT
			})
		),
	});

	const transformFolder = (descriptor) => ({
		type: descriptor.type,
		name: injector(descriptor.name, createLocalCtx(descriptor)),
		content: templateTransformer(descriptor.content, injector, globalCtx),
	});

	return templateDescriptor.map((descriptor) => {
		if (descriptor.type === TYPES.FOLDER) {
			return transformFolder(descriptor);
		}
		return transformFile(descriptor);
	});
};

export const keyPatternString = '{{s*[a-zA-Z_|0-9- ()]+s*}}';

export const injector = (
	keyValuePairs,
	{ transformers = {}, functions = {} } = {},
	globalCtx
) => (text, localCtx) => {
	const ctx = {
		...globalCtx, ...localCtx
	};
	const keyPattern = new RegExp(keyPatternString, 'g');
	const replacer = replaceKeyWithValue(
		keyValuePairs,
		transformers,
		functions,
		ctx
	);
	const transformedText = text.replace(keyPattern, replacer);
	return transformedText;
};

