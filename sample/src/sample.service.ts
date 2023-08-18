import { SampleContext } from "./database.context";
import { User } from "./models/user";

export class SampleService {

	dataFile: string = "Z:\\Developers\\kbrown\\_libraries\\sqlite-shaman\\sample\\.db\\database.sqlite";
	schema: string = "Z:\\Developers\\kbrown\\_libraries\\sqlite-shaman\\sample\\.db\\schema.sql";
	private context: SampleContext;

	initialize = async (): Promise<void> => {
		this.context = new SampleContext();
		this.context.initialize({databaseFilePath: this.dataFile, schemaFilePath: this.schema});
		await this.context.createIfNotExists();
	}

	addUser = async (user: User): Promise<User> => {
		await this.context.models.user.insert(user);
		return user;
	}

	getUsers = (): Promise<User[]> => {
		return this.context.models.user.find();
	}

	getUser = (userId: number): Promise<User> => {
		return this.context.models.user.findOne({identity: 'userId', args: [userId]});
	}

	deleteUser = (userId: number): Promise<void> => {
		return this.context.models.user.deleteOne({identity: 'userId', args: [userId]});
	}

	updateUser = (user: User) => {
		return this.context.models.user.update(user, {
			columns: ['emailAddress', 'lastName'],
			conditions: ['userId = ?'],
			args: [user.userId]
		});
	}

	getFirstUser = (): Promise<User> => {
		return this.context.models.user.first('userId');
	}

	getLastUser = (): Promise<User> => {
		return this.context.models.user.last('userId');
	}

	userExists = (userId: number): Promise<boolean> => {
		return this.context.models.user.exists({identity: 'userId', args: [userId]});
	}

}