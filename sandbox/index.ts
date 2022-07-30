import 'dotenv/config';
import { client } from '../src/services/redis';

const run = async () => {
	const result = await Promise.all([
		client.hSet('mycar#1', {
			brand: 'toyota44111',
			year: 2003,
			color: 'red'
		}),
		client.hSet('mycar#2', {
			brand: 'toyota449991',
			year: 20052,
			color: 'blue1'
		})
	]);

	const result2 = await Promise.all([
		client.hGetAll('mycar#1'),
		client.hGetAll('mycar#19999'),
		client.hGetAll('mycar#2')
	]);
	console.log(result2);
};
run();
