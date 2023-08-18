import * as fs from 'fs';
import { Database } from 'sqlite3';

import { Collection } from './collection';
import { Query, CreateConnection } from './mysql.functions';
import { DatabaseConfig } from './database.config';

export abstract class DatabaseContext {

  public abstract models: {[name: string]: Collection<any>};
  private transactionConnection: Database;
  private config: DatabaseConfig;

  public initialize = (config: DatabaseConfig) => {
    if (!config.databaseFilePath) {
      config.databaseFilePath = ':memory:';
      console.warn('No database file provided, running database in-memory.');
    }
    this.config = config;
    this.loadModels();
  }

  public createIfNotExists = async (): Promise<void> => {
    var factory = await this.connectionFactory();
    var schemaFile = await this.getSchemaFile();
    return new Promise((res, err) => {
      factory.connection.exec(schemaFile, function(ex) {
        if (!!ex) return err(ex);
        return res();
      });
    });
  }

  public beginTransaction = (type: string = 'serialized'): Promise<void> => {
    return new Promise((res, err) => {
      this.connectionFactory().then(rslt => {
        this.transactionConnection = rslt.connection;
        switch (type) {
          case 'parallel': {
            rslt.connection.parallelize(() => res());
            break;
          }
          case 'serialized':
          default: {
            rslt.connection.serialize(() => res());
            break;
          }
        }
      }).catch(ex => err(ex));
    })
  }

  public endTransaction = (): void => {
    this.transactionConnection = null;
  }

  protected query = async <T>(query: string, args: any): Promise<T[]> => {
    const rslt = await this.connectionFactory();
    return await Query<T>(rslt.connection, query, args);
  }

  private loadModels = () => {
    let keys = Object.keys(this.models);
    keys.forEach(key => this.models[key].initialize(key, this.connectionFactory));
  }

  private connectionFactory = async (): Promise<{connection: Database, transaction: boolean}> => {
    if (!!this.transactionConnection) 
      return Promise.resolve({connection: this.transactionConnection, transaction: true});
    const connection = await CreateConnection(this.config.databaseFilePath);
    return ({ connection, transaction: false });
  }

  private getSchemaFile = (): Promise<string> => {
    return new Promise<string>((res, err) => {
      if (!this.config.schemaFilePath && this.config.databaseFilePath != ":memory:") 
        return err(new Error("No schema file provided."));
      fs.readFile(this.config.schemaFilePath, "utf-8", (ex, contents) => {
        if (ex) return err(ex);
        return res(contents);
      });
    });
  }

}