import { itemsByViewsKey, itemsKey, itemsViewsKey } from '$services/keys';
import { client } from '$services/redis';
import { defineScript, RedisScripts } from 'redis';

export const incrementView = async (itemId: string, userId: string) => {
	// console.log('incrementView:: ', itemId, userId);
	// const inserted = await client.pfAdd(itemsViewsKey(itemId), userId);
	// if (inserted) {
	// 	return await Promise.all([
	// 		client.hIncrBy(itemsKey(itemId), 'views', 1),
	// 		client.zIncrBy(itemsByViewsKey(), 1, itemId)
	// 	]);
	// }
	return client.incrementViews(itemId, userId);
};

// Keys I need to access
// 1. itemsViewsKey(itemId)
// 2. itemsKey(itemId)
// 3. itemsByViewsKey()

// Arguments I need to accept
// 1. itemId
// 2. userId

// export const incrementViewScript = defineScript({
// 	NUMBER_OF_KEYS: 3,
// 	SCRIPT: `
// 		local itemsViewsKey = KEYS[1]
// 		local itemsKey = KEYS[2]
// 		local itemsByViewsKey = KEYS[3]

// 		local itemId = ARGV[1]
// 		local userId = ARGV[2]

// 		local inserted = redis.call("PFADD", itemsViewsKey, userId)

// 		if inserted == 1 then
// 			redis.call("HINCRBY", itemsKey, 1)
// 			redis.call("ZINCRBY", itemsByViewsKey, 1, itemId)
// 		end
// 	`,
// 	transformArguments(itemId: string, userId: string) {
// 		return [itemsViewsKey(itemId), itemsKey(itemId), itemsByViewsKey(), itemId, userId];
// 	},
// 	transformReply() {}
// });
