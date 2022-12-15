import { Trojan } from "./format/trojan.mjs";
import { Vmess } from "./format/vmess.mjs";
import { SSR } from "./format/ssr.mjs";
import { V2Object } from "../utils/types.mjs";

class Spider {
  private _spider!: Vmess | Trojan | SSR;

  constructor(account: V2Object) {
    if (account.vpn == "vmess") {
      this._spider = new Vmess(account);
    } else if (account.vpn == "trojan") {
      this._spider = new Trojan(account);
    } else if (account.vpn == "ssr") {
      this._spider = new SSR(account);
    }
  }

  toClash() {
    return this._spider.toClash();
  }

  toSingBox() {
    return this._spider.toSingBox();
  }

  toSurfboard() {
    return this._spider.toSurfboard();
  }

  toV2ray() {
    return this._spider.toV2ray();
  }

  toURL() {
    return this._spider.toURL();
  }
}

export { Spider };
