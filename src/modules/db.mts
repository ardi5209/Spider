/**
 * by dickymuliafiqri
 *
 * Used to create connection with database
 */

import sqlite3 from "sqlite3";
import { existsSync, mkdirSync } from "fs";
import { sleep } from "./helper.mjs";
import { logger, LogLevel } from "./logger.mjs";
import { V2Object } from "../utils/types.mjs";

const sql = sqlite3.verbose(); // Delete .verbose() on production

class Database {
  private _sqlitePool: sqlite3.Database[] = [];
  private _maxDatabaseConn: number = 50;
  private _databasePath: string = "./resources/database/db.sqlite";

  constructor() {
    if (!existsSync("./resources/database")) mkdirSync("./resources/database", { recursive: true });
  }

  set databasePath(path: string) {
    this._databasePath = path;
  }

  async make(connection: number = 10) {
    // Close all existing connection
    while (this._sqlitePool.length) {
      this._sqlitePool.shift()?.close();
    }

    for (let i = 1; i <= connection; i++) {
      await new Promise((resolve) => {
        resolve(new sql.Database(this._databasePath));
      }).then((res) => {
        this._sqlitePool.push(res as sqlite3.Database);
      });
    }

    console.log(`🗄 Total database connection successfully created: ${this._sqlitePool.length}`);
  }

  async connect(retry: number = 5): Promise<sqlite3.Database> {
    if (retry) {
      if (this._sqlitePool.length) {
        return this._sqlitePool.shift() as sqlite3.Database;
      } else {
        await sleep(1000);
        return await this.connect(retry - 1).then((res) => {
          if (res) return res;
          else throw new Error("Connection to Database failed!");
        });
      }
    } else {
      // Create new database conection to satisfy demands
      logger.log(LogLevel.info, "New database connection established!");
      return new sql.Database(this._databasePath);
    }
  }

  close(connection: sqlite3.Database | undefined) {
    if (connection) this._sqlitePool.push(connection);

    // Remove over created database connection
    while (this._sqlitePool.length > this._maxDatabaseConn) {
      logger.log(LogLevel.info, "High database connection!");
      this._sqlitePool.pop()?.close();
    }
  }

  async getAll() {
    const conn = await db.connect();
    const result: V2Object[] = [];

    const tables: string[] = await new Promise((resolve, reject) => {
      conn.all("SELECT name FROM sqlite_master WHERE type='table'", (err: Error, rows: any) => {
        if (err) {
          logger.log(LogLevel.error, err.message);
          reject(err.name);
        }
        const result: string[] = [];
        rows.forEach((row: any) => {
          if (row.name.startsWith("sqlite")) return;
          result.push(row.name);
        });

        resolve(result);
      });
    });

    for (const table of tables) {
      const query = `SELECT * FROM ${table}`;
      const accounts: any = await new Promise((resolve, reject) => {
        conn.all(query, (err: Error, rows: any) => {
          if (err) {
            logger.log(LogLevel.error, `[${table}] ${err.message}`);
            reject();
          }

          resolve(rows);
        });
      }).finally(() => {
        db.close(conn);
      });

      for (const account of accounts) {
        if (table.match(/vmess/i)) {
          result.push({
            address: account["ADDRESS"],
            port: account["PORT"],
            id: account["PASSWORD"],
            security: account["SECURITY"],
            alterId: account["ALTER_ID"],
            host: account["HOST"],
            tls: account["TLS"] ? "tls" : "",
            network: account["NETWORK"],
            path: account["PATH"],
            skipCertVerify: account["SKIP_CERT_VERIFY"] ? true : false,
            sni: account["SNI"],
            remark: account["REMARK"],
            cdn: account["IS_CDN"] ? true : false,
            cc: account["CC"],
            region: account["REGION"],
            vpn: "vmess",
          } as V2Object);
        } else if (table.match(/trojan/i)) {
          result.push({
            address: account["ADDRESS"],
            port: account["PORT"],
            id: account["PASSWORD"],
            host: account["HOST"],
            security: account["SECURITY"],
            flow: account["FLOW"],
            level: account["LEVEL"],
            method: account["METHOD"],
            ota: account["OTA"] ? true : false,
            path: account["PATH"],
            network: account["TYPE"],
            skipCertVerify: account["ALLOW_INSECURE"] ? true : false,
            sni: account["SNI"],
            remark: account["REMARK"],
            cdn: account["IS_CDN"] ? true : false,
            cc: account["CC"],
            region: account["REGION"],
            vpn: "trojan",
          } as V2Object);
        } else if (table.match(/ssr/i)) {
          result.push({
            address: account["ADDRESS"],
            port: account["PORT"],
            id: account["PASSWORD"],
            method: account["METHOD"],
            proto: account["PROTOCOL"],
            protoParam: account["PROTOCOL_PARAM"],
            obfs: account["OBFS"],
            obfsParam: account["OBFS_PARAM"],
            group: account["GROUP"],
            remark: account["REMARK"],
            cc: account["CC"],
            region: account["REGION"],
            vpn: "ssr",
          } as V2Object);
        }
      }
    }
    return result;
  }
}

const db = new Database();
export { db };
