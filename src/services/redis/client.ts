import { itemsByViewsKey, itemsKey, itemsViewsKey } from '$services/keys';
import { createClient, defineScript } from 'redis';
import { createIndexes } from './create-indexes';

const incrementViewsScript = {
	NUMBER_OF_KEYS: 3,
	SCRIPT: `
		local itemsViewsKey = KEYS[1]
		local itemsKey = KEYS[2]
		local itemsByViewsKey = KEYS[3]

		local itemId = ARGV[1]
		local userId = ARGV[2]

		local inserted = redis.call("PFADD", itemsViewsKey, userId)

		if inserted == 1 then
			redis.call("HINCRBY", itemsKey, "views", 1)
			redis.call("ZINCRBY", itemsByViewsKey, 1, itemId)
		end
	`,
	transformArguments(itemId: string, userId: string) {
		console.log(itemsViewsKey(itemId), itemsKey(itemId), itemsByViewsKey(), itemId, userId);
		return [itemsViewsKey(itemId), itemsKey(itemId), itemsByViewsKey(), itemId, userId];
	},
	transformReply() {}
};

const unlockScript = {
	NUMBER_OF_KEYS: 1,
	SCRIPT: `
		if redis.call("GET", KEYS[1]) == ARGV[1] then
			return redis.call("DEL", KEYS[1])
		end
	`,
	transformArguments(key: string, token: string) {
		return [key, token];
	},
	transformReply(reply: any) {
		return reply;
	}
};

const client = createClient({
	socket: {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT)
	},
	password: process.env.REDIS_PW,
	scripts: {
		incrementViews: defineScript(incrementViewsScript),
		unlock: defineScript(unlockScript)
	}
});

// client.on('connect', async () => {
// 	await client.addOneAndStore('myBooks:count', 10);
// 	const result = await client.get('myBooks:count');
// 	console.log('result:: ', result);
// });

client.on('error', (err) => console.error(err));
client.on('connect', async () => {
	try {
		await createIndexes();
	} catch (error) {
		console.error(error);
	}
});
client.connect();

export { client };
