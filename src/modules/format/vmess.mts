import { V2Object } from "../../utils/types.mjs";
import { base64Encode } from "../helper.mjs";
import { VmessInterface } from "../../utils/types.mjs";

type toFormat = "Sing-Box" | "V2ray" | "Clash" | "Surfboard";

class Vmess {
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

  // Static method start here
  // Convert to various format
  to(target: toFormat): any {
    let account = this.account;

    try {
      if (target == "Sing-Box") {
        let proxy: any = {
          type: account.vpn,
          tag: account.remark,
          server: account.address,
          server_port: account.port,
          uuid: account.id,
          security: "auto",
          alter_id: account.alterId || 0,
          tls: {
            enabled: account.tls ? true : false,
            insecure: account.skipCertVerify || true,
            server_name: account.sni || account.host,
          },
        };

        if (account.network == "ws") {
          proxy.transport = {
            type: "ws",
            path: account.path,
            headers: {
              Host: account.host,
            },
          };
        }

        return proxy;
      } else if (target == "V2ray") {
        let proxy: any = {
          mux: {
            concurrency: 8,
            enabled: false,
          },
          protocol: account.vpn,
          settings: {
            vnext: [
              {
                address: account.address,
                port: account.port,
                users: [
                  {
                    alterId: account.alterId,
                    encryption: "",
                    flow: "",
                    id: account.id,
                    level: 8,
                    security: "auto",
                  },
                ],
              },
            ],
          },
          streamSettings: {
            network: account.network,
            security: account.tls,
            tlsSettings: {
              allowInsecure: true,
              serverName: account.sni || account.host,
            },
          },
          tag: `proxy-${account.remark}`,
        };

        if (account.network == "ws") {
          proxy.streamSettings.wsSettings = {
            headers: {
              Host: account.host,
            },
            path: account.path,
          };
        }

        return proxy;
      } else if (target == "Clash") {
        const proxy: string[] = [];
        proxy.push(`  - name: '${account.remark}'`);
        proxy.push(`    server: ${account.address}`);
        proxy.push(`    type: ${account.vpn}`);
        proxy.push(`    port: ${account.port}`);
        proxy.push(`    uuid: ${account.id}`);
        proxy.push(`    alterId: ${account.alterId}`);
        proxy.push(`    cipher: auto`);
        proxy.push(`    tls: ${account.tls ? true : false}`);
        proxy.push(`    udp: true`);
        proxy.push(`    skip-cert-verify: ${account.skipCertVerify}`);
        proxy.push(`    network: ${account.network}`);
        proxy.push(`    servername: ${account.sni || account.host}`);
        if (account.network == "ws") {
          proxy.push(`    ws-opts: `);
          proxy.push(`      path: ${account.path}`);
          proxy.push(`      headers:`);
          proxy.push(`        Host: ${account.host}`);
        }

        return proxy.join("\n");
      } else if (target == "Surfboard") {
        const proxy: string[] = [];
        proxy.push(`${account.remark}=vmess`);
        proxy.push(`${account.address}`);
        proxy.push(`${account.port}`);
        proxy.push(`username=${account.id}`);
        proxy.push(`udp-relay=true`);
        proxy.push(`tls=${account.tls ? true : false}`);
        proxy.push(`skip-cert-verify=${account.skipCertVerify}`);
        proxy.push(`sni=${account.sni || account.host}`);

        if (account.network == "ws") {
          proxy.push(`ws=true`);
          proxy.push(`ws-path=${account.path}`);
          proxy.push(`ws-headers=Host:${account.host}`);
        }

        return proxy.join(",");
      }
    } catch (e: any) {
      return { vpn: "vmess", error: e.message } as V2Object;
    }
  }

  // Convert to url
  from() {
    let account = this.account;
    let vmess: VmessInterface = {
      add: account.address,
      aid: account.alterId,
      host: account.host,
      id: account.id,
      net: account.network,
      path: account.path,
      port: account.port,
      ps: account.remark,
      tls: account.tls,
      type: account.type,
      security: account.security || "auto",
      "skip-cert-verify": account.skipCertVerify,
      sni: account.sni,
      cdn: account.cdn ? true : false,
      scy: "",
    };

    return `${account.vpn}://${base64Encode(JSON.stringify(vmess))}`;
  }
}

export { Vmess };
