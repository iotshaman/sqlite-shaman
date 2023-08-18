import { Database } from "sqlite3";
import { GetMySqlColumns, GetMySqlConditions, GetMySqlUpdateColumns, Insert, Query, Update, CreateCommaDelimitedList } from "./mysql.functions";
import { EntityQuery } from "./entity-query";

export class Collection<T> {

  private name: string;
  private connectionFactory: () => Promise<{connection: Database, transaction: boolean}>;

  initialize = (name: string, connectionFactory: () => Promise<{connection: Database, transaction: boolean}>) => {
    this.name = name;
    this.connectionFactory = connectionFactory;
  }

  find = (query?: EntityQuery): Promise<T[]> => {
    if (!query) return this.runMysqlQuery(`SELECT * FROM ${this.name};`);
    let columns = GetMySqlColumns(query);
    let qString = `SELECT ${columns} FROM ${this.name}`;
    let conditions = GetMySqlConditions(query);
    if (!conditions) return this.runMysqlQuery(`${qString};`, query.args, query.debug);
    return this.runMysqlQuery(`${qString} WHERE ${conditions};`, query.args, query.debug);
  }

  findOne = (query: EntityQuery): Promise<T> => {
    let columns = GetMySqlColumns(query);
    let qString = `SELECT ${columns} FROM ${this.name} WHERE ${query.identity} = ? LIMIT 1;`;
    let req = this.runMysqlQuery<T>(qString, query.args, query.debug);
    return req.then(rslt => rslt.length == 0 ? null : rslt[0]);
  }

  insert = (model: T, debug: boolean = false): Promise<number> => {
    let keys = Object.keys(model);
    let object: any = keys.reduce((a, b) => [...a, model[b]], []);
    let columns = CreateCommaDelimitedList(keys);
    let placeholder = CreateCommaDelimitedList(keys.map(k => '?'));
    let qString = `INSERT INTO ${this.name} (${columns}) VALUES (${placeholder})`;
    return this.runMysqlInsert(qString, object, debug);
  }

  update = (model: T, query: EntityQuery): Promise<void> => {
    let columns = GetMySqlUpdateColumns(query);
    let conditions = GetMySqlConditions(query);
    let qString = `UPDATE ${this.name} SET ${columns} WHERE ${conditions}`;
    let columnValues = query.columns.map(c => model[c]);
    let args = [...columnValues, ...query.args];
    return this.runMysqlUpdate(qString, args, query.debug);
  }

  delete = (query: EntityQuery): Promise<void> => {
    if (!query.conditions) return Promise.reject("Delete all operation not allowed.");
    let qString = `DELETE FROM ${this.name}`;
    let conditions = GetMySqlConditions(query);
    return this.runMysqlUpdate(`${qString} WHERE ${conditions};`, query.args, query.debug);
  }

  deleteOne = (query: EntityQuery): Promise<void> => {
    let qString = `DELETE FROM ${this.name} WHERE ${query.identity} = ?;`;
    return this.runMysqlUpdate(qString, query.args, query.debug);
  }

  first = (columnName: string, query?: EntityQuery): Promise<T> => {
    if (!columnName) return Promise.reject(new Error("Column name not provided"));
    let columns = GetMySqlColumns(query);
    let qString = `SELECT ${columns} FROM ${this.name}`;
    let conditions = GetMySqlConditions(query);
    if (!conditions) qString = `${qString} ORDER BY ${columnName} ASC LIMIT 1;`;
    else qString = `${qString} WHERE ${conditions} ORDER BY ${columnName} ASC LIMIT 1;`;
    let req = this.runMysqlQuery<T>(qString, query?.args, query?.debug);
    return req.then(rslt => rslt.length == 0 ? null : rslt[0]);
  }

  last = (columnName: string, query?: EntityQuery): Promise<T> => {
    if (!columnName) return Promise.reject(new Error("Column name not provided"));
    let columns = GetMySqlColumns(query);
    let qString = `SELECT ${columns} FROM ${this.name}`;
    let conditions = GetMySqlConditions(query);
    if (!conditions) qString = `${qString} ORDER BY ${columnName} DESC LIMIT 1;`;
    else qString = `${qString} WHERE ${conditions} ORDER BY ${columnName} DESC LIMIT 1;`;
    let req = this.runMysqlQuery<T>(qString, query?.args, query?.debug);
    return req.then(rslt => rslt.length == 0 ? null : rslt[0]);
  }

  exists = (query: EntityQuery): Promise<boolean> => {
    return this.findOne(query).then(rslt => !!rslt);
  }

  private runMysqlQuery = <T>(query: string, args: any = null, debug: boolean = false): Promise<T[]> => {
    if (!!debug) {
      console.log(`Query string: ${query}`);
      console.log(`Query params: ${JSON.stringify(args)}`);
    }
    return this.connectionFactory()
      .then(rslt => Query<T>(rslt.connection, query, args, !rslt.transaction));
  }

  private runMysqlInsert = (query: string, args: any = null, debug: boolean = false): Promise<number> => {
    if (!!debug) {
      console.log(`Query string: ${query}`);
      console.log(`Query params: ${JSON.stringify(args)}`);
    }
    return this.connectionFactory()
      .then(rslt => Insert(rslt.connection, query, args, !rslt.transaction));
  }

  private runMysqlUpdate = (query: string, args: any = null, debug: boolean = false): Promise<void> => {
    if (!!debug) {
      console.log(`Query string: ${query}`);
      console.log(`Query params: ${JSON.stringify(args)}`);
    }
    return this.connectionFactory()
      .then(rslt => Update(rslt.connection, query, args, !rslt.transaction));
  }

}