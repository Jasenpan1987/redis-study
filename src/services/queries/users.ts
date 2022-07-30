import { usernamesKey, usernamesUniqueKey, usersKey } from '$services/keys';
import { client } from '$services/redis';
import type { CreateUserAttrs } from '$services/types';
import { genId } from '$services/utils';

export const getUserByUsername = async (username: string) => {
	const userId = await client.zScore(usernamesKey(), username);
	if (!userId) {
		throw new Error('User not found');
	}

	return await getUserById(userId.toString(16));
};

export const getUserById = async (id: string) => {
	const rawUser = await client.hGetAll(usersKey(id));
	if (Object.keys.length === 0) {
		return null;
	}
	return deserialize(id, rawUser);
};

export const createUser = async (attrs: CreateUserAttrs) => {
	const id = genId();

	const exists = await client.sIsMember(usernamesUniqueKey(), attrs.username);
	if (exists) {
		throw new Error('Username is taken.');
	}

	await client.hSet(usersKey(id), serialize(attrs));
	await client.sAdd(usernamesUniqueKey(), attrs.username);
	await client.zAdd(usernamesKey(), {
		value: attrs.username,
		score: parseInt(id, 16)
	});
	return id;
};

const serialize = ({ username, password }: CreateUserAttrs) => {
	return { username, password };
};

const deserialize = (id: string, { username, password }: { [key: string]: string }) => {
	return {
		id,
		username,
		password
	};
};
