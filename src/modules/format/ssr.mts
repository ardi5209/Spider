import { V2Object } from "../../utils/types.mjs";
import { base64Encode } from "../helper.mjs";
import { SSRInterface } from "../../utils/types.mjs";

type toFormat = "Sing-Box" | "V2ray" | "Clash" | "Surfboard";
class SSR {
  private account: V2Object;

  constructor(account: V2Object) {
    this.account = account;
  }

  toClash() {
    return this.to("Clash");
  }

  toSingBox() {
    return this.to("Sing-Box");
  }

  toSurfboard() {
    return this.to("Surfboard");
  }

  toV2ray() {
    return this.to("V2ray");
  }

  toURL() {
    return this.from();
  }

  // Convert to various format
  to(target: toFormat): any {
    let account = this.account;

    if (target == "Sing-Box") {
      let proxy: any = {
        type: "shadowsocksr",
        tag: account.remark,

        server: account.address,
        server_port: account.port,
        method: account.method,
        password: account.id,
        obfs: account.obfs,
        obfs_param: account.obfsParam,
        protocol: account.proto,
        protocol_param: account.protoParam,
      };

      return proxy;
    } else if (target == "V2ray") {
      return "";
    } else if (target == "Clash") {
      const proxy: string[] = [];
      proxy.push(`  - name: '${account.remark}'`);
      proxy.push(`    server: ${account.address}`);
      proxy.push(`    type: ${account.vpn}`);
      proxy.push(`    port: ${account.port}`);
      proxy.push(`    password: ${account.id}`);
      proxy.push(`    cipher: ${account.method}`);
      proxy.push(`    protocol: ${account.proto}`);
      proxy.push(`    protocol-param: ${account.protoParam}`);
      proxy.push(`    obfs: ${account.obfs}`);
      proxy.push(`    obfs-param: ${account.obfsParam}`);
      proxy.push(`    udp: true`);

      return proxy.join("\n");
    } else if (target == "Surfboard") {
      return "";
    }
  }

  // Convert to url
  from() {
    let account = this.account;
    let ssr: SSRInterface = {
      hostname: account.address,
      port: account.port.toString(),
      query: {
        method: account.method || "",
        group: base64Encode(account.group || ""),
        obfs: account.obfs || "",
        obfsparam: base64Encode(account.obfsParam || ""),
        password: base64Encode(account.id || ""),
        protocol: account.proto || "",
        protoparam: base64Encode(account.protoParam || ""),
        remarks: base64Encode(account.remark || ""),
      },
    } as SSRInterface;

    return `${account.vpn}://${base64Encode(
      `${ssr.hostname}:${ssr.port}:${ssr.query.protocol}:${ssr.query.method}:${ssr.query.obfs}:${ssr.query.password}/?obfsparam=${ssr.query.obfsparam}&remarks=${ssr.query.remarks}`
    )}`;
  }
}

export { SSR };
