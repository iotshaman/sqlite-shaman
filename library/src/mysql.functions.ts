import { Database } from "sqlite3";
import { EntityQuery } from "./entity-query";

export function CreateConnection(path: string = ':memory:'): Promise<Database> {
  return new Promise<Database>((res, err) => {
    let db: Database = new Database(path, function(ex) {
      if (!!ex) return err(ex);
      return res(db);
    });
  });
}

export function Query<T>(database: Database, query: string, args: any, release: boolean = true): Promise<T[]> {
  return new Promise<T[]>((res, err) => {
    database.all(query, args || [], (ex, rslt: T[]) => {
      if (ex) return err(ex);
      if (release) database.close();
      return res(rslt);
    });
  })
}

export function Insert(database: Database, query: string, args: any, release: boolean = true): Promise<number> {
  return new Promise<number>((res, err) => {
    database.run(query, args, function (ex) {
      if (release) database.close();
      if (ex) return err(ex);
      return res(this.lastID);
    });
  })
}

export function Update(database: Database, query: string, args: any, release: boolean = true): Promise<void> {
  return new Promise<void>((res, err) => {
    database.run(query, args, function (ex) {
      if (release) database.close();
      if (ex) return err(ex);
      return res();
    });
  })
}

export function CreateCommaDelimitedList(array: string[]): string {
  return array.reduce((a, b) => `${a}${!a ? "" : ", "}${b}`, "");
}

export function GetMySqlColumns(query: EntityQuery | null): string {
  if (!query || !query.columns) return '*';
  return CreateCommaDelimitedList(query.columns);
}

export function GetMySqlUpdateColumns(query: EntityQuery | null): string {
  if (!query || !query.columns) throw new Error("Columns must be provided when performing update.");
  return CreateCommaDelimitedList(query.columns.map(c => `${c} = ?`));
}

export function GetMySqlConditions(query: EntityQuery | null) {
  if (!query || !query.conditions || query.conditions.length == 0) return '';
  return query.conditions.reduce((a, b) => {
    return `${a}${a == "" ? "" : " AND "}${b}`;
  }, '');
}