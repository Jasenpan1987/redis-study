import { itemsIndexKey } from '$services/keys';
import { client } from '$services/redis';
import { deserialize } from './deserialize';

export const searchItems = async (term: string, size: number = 5) => {
	// 1. preprocess term for fuzzy search
	const cleanedTerm = term
		.replaceAll(/[^a-zA-Z0-9 ]/g, '')
		.trim()
		.split(' ')
		.map((word) => (word ? `%${word}%` : ''))
		.join(' '); // & relationship

	// 2. look at cleanedTerm make sure it's valid
	if (cleanedTerm.length === 0) {
		return [];
	}

	const query = `(@name:(${cleanedTerm})=>{ $weight: 5.0 }) | (@description:(${cleanedTerm}))`;
	// 3. use client to execute a search
	const result = await client.ft.search(
		itemsIndexKey(),
		// cleanedTerm, // this means we will search on all the text fields (name and description)
		query,
		{
			LIMIT: {
				from: 0,
				size
			}
		}
	);

	// 4. deserialize and return the result
	return result.documents.map((doc) => deserialize(doc.id, doc.value as any));
};
