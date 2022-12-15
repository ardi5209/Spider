import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { V2Object } from "../utils/types.mjs";
import { Bugs } from "./bugs.mjs";
import { base64Encode, sleep } from "./helper.mjs";
import { logger, LogLevel } from "./logger.mjs";
import { Spider } from "./spider.mjs";

class Writer {
  private baseRemarks: string[] = [];
  private baseClashProxies: string[] = ["proxies:"];
  private baseProxyBoard: string[] = [];
  private baseBoardConfig: any = readFileSync("./resources/config/surfboard/surfboard.conf").toString();
  private baseRayConfig: any = JSON.parse(readFileSync("./resources/config/v2ray/config.json").toString());
  private baseBoxConfig: any = JSON.parse(readFileSync("./resources/config/sing-box/config.json").toString());
  private bugBundles: string[] = readdirSync("./resources/bugs");
  private proxyModes = ["select", "url-test", "fallback", "load-balance"];

  private formats: Array<{
    name: "clash" | "v2ray" | "surfboard" | "sing-box" | "base64";
    filename: string;
    format: string | null;
  }> = [
    {
      name: "clash",
      filename: "providers",
      format: "yaml",
    },
    {
      name: "v2ray",
      filename: "config",
      format: "json",
    },
    {
      name: "surfboard",
      filename: "board",
      format: "conf",
    },
    {
      name: "sing-box",
      filename: "config",
      format: "json",
    },
    {
      name: "base64",
      filename: "base64",
      format: null,
    },
  ];

  finalResult: any = {};

  constructor() {
    for (const format of [{ name: "" }, ...this.formats]) {
      if (!existsSync(`./result/${format.name}`)) mkdirSync(`./result/${format.name}`, { recursive: true });
    }
  }

  private split(accounts: V2Object[]) {
    for (let bug of this.bugBundles) {
      bug = bug.replace(".json", "");
      const bugs = new Bugs(bug);
      for (const format of this.formats) {
        let savePath = `./result/${format.name}`;
        for (let account of accounts) {
          // Prepare split result
          let proxy: any = "";
          account = bugs.fill(account, account.cdn ? "cdn" : "sni");
          if (account.error) {
            logger.log(LogLevel.error, `[${bug}] ${account.error}`);
            continue;
          }

          const spider = new Spider(account);
          switch (format.name) {
            case "clash":
              proxy = spider.toClash();
              break;
            case "v2ray":
              proxy = spider.toV2ray();
              break;
            case "surfboard":
              proxy = spider.toSurfboard();
              break;
            case "sing-box":
              proxy = spider.toSingBox();
              break;
            case "base64":
              proxy = spider.toURL();
              break;
          }

          // Split result
          for (const key of [null, account.cc, account.region]) {
            let filename = `${savePath}/${format.filename}-${bug}${key ? `-${key}` : ""}${
              format.format ? `.${format.format}` : ""
            }`;
            if (this.finalResult[filename]) this.finalResult[filename].push(proxy);
            else this.finalResult[filename] = [proxy];
          }
        }
      }
    }
  }

  write(accounts: V2Object[]) {
    this.split(accounts);

    for (const filename of Object.keys(this.finalResult)) {
      if (filename.match("clash")) {
        let clashConfig = structuredClone(this.baseClashProxies);
        clashConfig.push(...this.finalResult[filename]);
        writeFileSync(filename, clashConfig.join("\n"));
      } else if (filename.match("v2ray")) {
        let rayConfig = structuredClone(this.baseRayConfig);
        rayConfig.outbounds.push(...this.finalResult[filename]);
        writeFileSync(filename, JSON.stringify(rayConfig, null, 2));
      } else if (filename.match("surfboard")) {
        let boardConfig = structuredClone(this.baseBoardConfig);
        let remarks = structuredClone(this.baseRemarks);
        let proxyBoard = structuredClone(this.baseProxyBoard);
        for (const proxy of this.finalResult[filename]) {
          if (proxy.match(/^(.+?)=/)) {
            remarks.push(proxy.match(/^(.+?)=/)[1]);
            proxyBoard.push(proxy);
          }
        }

        boardConfig = boardConfig
          .replace("PROXIES_PLACEHOLDER", proxyBoard.join("\n"))
          .replace("FILENAME_PLACEHOLDER", (filename.match(/\/(.+)$/) || [])[1]);

        for (const proxyMode of this.proxyModes) {
          let mode = `${proxyMode.toUpperCase()} = ${proxyMode}`;

          for (const remark of remarks) {
            mode += `,${remark}`;
          }
          boardConfig += `\n${mode}`;
        }

        writeFileSync(filename, boardConfig);
      } else if (filename.match("sing-box")) {
        let boxConfig = structuredClone(this.baseBoxConfig);
        for (const proxy of this.finalResult[filename]) {
          boxConfig.outbounds[3].outbounds.push(proxy.tag);
          boxConfig.outbounds.push(proxy);
        }

        writeFileSync(filename, JSON.stringify(boxConfig, null, 2));
      } else if (filename.match("base64")) {
        let proxies = [...this.finalResult[filename]];

        writeFileSync(filename, base64Encode(proxies.join("\n")));
      }
    }
  }
}

const writer = new Writer();
export { writer };
