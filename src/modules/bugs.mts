import { readFileSync } from "fs";
import { V2Object } from "../utils/types.mjs";

interface BugsObject {
  sni: Array<string>;
  cdn: Array<string>;
}

class Bugs {
  private _sni: Array<string> = [];
  private _cdn: Array<string> = [];
  private bugs: BugsObject;

  constructor(bundle: string) {
    this.bugs = JSON.parse(readFileSync(`./resources/bugs/${bundle}.json`).toString());

    this._sni = this.bugs.sni;
    this._cdn = this.bugs.cdn;
  }

  get sni(): string {
    return this._sni[Math.floor(Math.random() * this._sni.length)];
  }

  get cdn(): string {
    return this._cdn[Math.floor(Math.random() * this._cdn.length)];
  }

  fill(account: V2Object, mode: "sni" | "cdn" | "none" = "none") {
    const sni = this.sni;
    const cdn = this.cdn;

    if (mode == "cdn") {
      if (!cdn) return { error: "CDN not provided!" } as V2Object;
    } else if (mode == "sni") {
      if (!sni) return { error: "SNI not provided!" } as V2Object;
    }

    if (account.vpn == "ssr") {
      if (account.obfs?.match("tls")) {
        account.obfsParam = `obfs=tls;obfs-host=${sni}`;
      } else {
        account.obfsParam = `obfs=http;obfs-host=${sni}`;
      }
    } else {
      if (mode == "cdn") {
        account.address = cdn;
      } else {
        account.host = sni;
        account.sni = sni;
      }
    }
    return account;
  }
}

export { Bugs };
