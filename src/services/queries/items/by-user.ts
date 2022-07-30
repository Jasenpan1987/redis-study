import { itemsIndexKey } from '$services/keys';
import { client } from '$services/redis';
import { deserialize } from './deserialize';

interface QueryOpts {
	page: number;
	perPage: number;
	sortBy: string;
	direction: string;
}

export const itemsByUser = async (
	userId: string,
	{ page, perPage, sortBy, direction }: QueryOpts
) => {
	const query = `@ownerId:{${userId}}`;
	const sort = sortBy &&
		direction && {
			BY: sortBy,
			DIRECTION: direction
		};

	const { total, documents } = await client.ft.search(itemsIndexKey(), query, {
		ON: 'HASH',
		SORTBY: sort,
		LIMIT: {
			from: page * perPage,
			size: perPage
		}
	} as any);

	// console.log(total, documents);
	return {
		totalPages: Math.ceil(total / perPage),
		items: documents.map(({ id, value }) => {
			return deserialize(id.replace('items#', ''), value as any);
		})
	};
};
