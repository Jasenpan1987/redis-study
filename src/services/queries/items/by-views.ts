import { itemsByViewsKey, itemsKey } from '$services/keys';
import { client } from '$services/redis';
import { deserialize } from './deserialize';

export const itemsByViews = async (order: 'DESC' | 'ASC' = 'DESC', offset = 0, count = 10) => {
	let results = (await client.sort(itemsByViewsKey(), {
		GET: [
			'#',
			`${itemsKey('*')}->name`,
			`${itemsKey('*')}->views`,
			`${itemsKey('*')}->endingAt`,
			`${itemsKey('*')}->imageUrl`,
			`${itemsKey('*')}->price`
		],
		BY: 'nosort', // this key does not exists in items:views set, so it follows the sort by the set
		DIRECTION: order,
		LIMIT: {
			offset,
			count
		}
	})) as string[];

	const items = [];
	while (results.length) {
		const [id, name, views, endingAt, imageUrl, price, ...rest] = results;
		items.push(deserialize(id, { name, views, endingAt, imageUrl, price }));
		results = rest;
	}

	return items;
};
