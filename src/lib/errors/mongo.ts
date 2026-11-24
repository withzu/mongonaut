export class MongoConnectionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MongoConnectionError';
	}
}
