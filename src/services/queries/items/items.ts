import { itemsByEndingAtKey, itemsByPriceKey, itemsByViewsKey, itemsKey } from '$services/keys';
import { client } from '$services/redis';
import type { CreateItemAttrs } from '$services/types';
import { genId } from '$services/utils';
import { deserialize } from './deserialize';
import { serialize } from './serialize';

export const getItem = async (id: string) => {
	const itemRaw = await client.hGetAll(itemsKey(id));
	if (Object.keys(itemRaw).length === 0) {
		return null;
	}
	return deserialize(id, itemRaw);
};

export const getItems = async (ids: string[]) => {
	const commands = ids.map((id) => client.hGetAll(itemsKey(id)));
	const results = await Promise.all(commands);
	return results.map((result, idx) => {
		if (Object.keys(result).length === 0) {
			return null;
		}

		return deserialize(ids[idx], result);
	});
};

export const createItem = async (attrs: CreateItemAttrs, userId: string) => {
	const itemId = genId();
	const serialized = serialize(attrs);
	await Promise.all([
		client.hSet(itemsKey(itemId), serialized),
		client.zAdd(itemsByViewsKey(), {
			value: itemId,
			score: 0
		}),
		client.zAdd(itemsByEndingAtKey(), {
			value: itemId,
			score: serialized.endingAt
		}),
		client.zAdd(itemsByPriceKey(), {
			value: itemId,
			score: 0
		})
	]);

	return itemId;
};
