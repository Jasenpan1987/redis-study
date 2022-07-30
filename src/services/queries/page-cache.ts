import { pageCacheKey } from '$services/keys';
import { client } from '$services/redis';

export const getCachedPage = async (route: string) => {
	return await client.get(pageCacheKey(route));
};

export const setCachedPage = async (route: string, page: string) => {
	await client.set(pageCacheKey(route), page, { EX: 30 });
};
