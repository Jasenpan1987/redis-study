import type RedisClient from '@node-redis/client/dist/lib/client';
import { randomBytes } from 'crypto';
import { client } from './client';

type Client = typeof client;

export const withLock = async (
	key: string,
	callback: (redisClient: Client, signal: any) => any
) => {
	// init new variable to control the retry behavior
	const retryDelayInMs = 100;
	let retries = 20;

	// generate a random value to store the lock key
	const token = randomBytes(6).toString('hex');
	// create the lock key
	const lockKey = `lock:${key}`;

	// setup a while loop to implement the retry behavior
	while (retries >= 0) {
		retries -= 1;
		// try set NX
		const acquired = await client.set(lockKey, token, {
			NX: true,
			PX: 2000
		});

		if (!acquired) {
			// if write to lock failed (means it already has a value), do a brief pause (retryDelayInMs), and retry
			await pause(retryDelayInMs);
			continue;
		}

		try {
			const signal = { expired: false };
			setTimeout(() => {
				signal.expired = true;
			}, 2000);
			const proxyClient = buildClientProxy(2000);
			// otherwise, run the callback
			const result = await callback(proxyClient, signal);
			return result;
		} finally {
			// delete the lock key
			await client.unlock(lockKey, token);
		}
	}
};

const buildClientProxy = (timeoutInMs: number) => {
	const startTime = Date.now();

	const handler = {
		get(target: Client, prop: keyof Client) {
			if (Date.now() >= startTime + timeoutInMs) {
				// Lock expire
				throw new Error('Lock is expired.');
			}
			const value = target[prop];
			return typeof value === 'function' ? value.bind(target) : value;
		}
	};

	return new Proxy(client, handler) as Client;
};

const pause = (duration: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
};
