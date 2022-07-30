import { bidHistoryKey, itemsByPriceKey, itemsKey } from '$services/keys';
import { client, withLock } from '$services/redis';
import type { CreateBidAttrs, Bid } from '$services/types';
import { DateTime } from 'luxon';
import { getItem } from './items';

// // redis transaction / watch
// export const createBid = async (attrs: CreateBidAttrs) => {
// 	return client.executeIsolated(async (isolatedClient) => {
// 		await isolatedClient.watch(itemsKey(attrs.itemId));

// 		const item = await getItem(attrs.itemId);
// 		if (!item) {
// 			throw new Error('Item not exists');
// 		}

// 		if (item.price >= attrs.amount) {
// 			throw new Error('Bid too low');
// 		}

// 		if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
// 			throw new Error('Bid has already closed');
// 		}

// 		return isolatedClient
// 			.multi()
// 			.rPush(
// 				bidHistoryKey(attrs.itemId),
// 				serializeHistory(attrs.amount, attrs.createdAt.toMillis())
// 			)
// 			.hSet(itemsKey(item.id), {
// 				bids: item.bids + 1,
// 				price: attrs.amount,
// 				highestBidUserId: attrs.userId
// 			})
// 			.zAdd(itemsByPriceKey(), {
// 				value: item.id,
// 				score: attrs.amount
// 			})
// 			.exec();
// 	});
// };

// redis lock
export const createBid = async (attrs: CreateBidAttrs) => {
	return withLock(attrs.itemId, async (lockedClient: typeof client, signal: any) => {
		const item = await getItem(attrs.itemId);
		if (!item) {
			throw new Error('Item not exists');
		}

		if (item.price >= attrs.amount) {
			throw new Error('Bid too low');
		}

		if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
			throw new Error('Bid has already closed');
		}

		if (signal.expired) {
			throw new Error('Lock expired, can not write data.');
		}

		// pipeline
		return Promise.all([
			lockedClient.rPush(
				bidHistoryKey(attrs.itemId),
				serializeHistory(attrs.amount, attrs.createdAt.toMillis())
			),
			lockedClient.hSet(itemsKey(item.id), {
				bids: item.bids + 1,
				price: attrs.amount,
				highestBidUserId: attrs.userId
			}),
			lockedClient.zAdd(itemsByPriceKey(), {
				value: item.id,
				score: attrs.amount
			})
		]);
	});
};

export const getBidHistory = async (itemId: string, offset = 0, count = 10): Promise<Bid[]> => {
	const startIdx = -1 * offset - count;
	const endIdx = -1 - offset;
	return (await client.lRange(bidHistoryKey(itemId), startIdx, endIdx)).map((bid) =>
		deserializeHistory(bid)
	);
};

const serializeHistory = (amount: number, createdAtUnix: number) => {
	return `${amount}:${createdAtUnix}`;
};

const deserializeHistory = (storedValue: string) => {
	const [amount, createdAt] = storedValue.split(':');
	return { amount: parseFloat(amount), createdAt: DateTime.fromMillis(parseInt(createdAt)) };
};
