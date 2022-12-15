import { V2Object } from "../../utils/types.mjs";
import { TrojanInterface } from "../../utils/types.mjs";

type toFormat = "Sing-Box" | "V2ray" | "Clash" | "Surfboard";

class Trojan {
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
        type: account.vpn,
        tag: account.remark,
        server: account.address,
        server_port: account.port,
        password: account.id,
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
          servers: [
            {
              address: account.address,
              flow: account.flow,
              level: account.level,
              method: account.method,
              ota: account.ota,
              password: account.id,
              port: account.port,
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
      proxy.push(`    password: ${account.id}`);
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
      proxy.push(`${account.remark}=trojan`);
      proxy.push(`${account.address}`);
      proxy.push(`${account.port}`);
      proxy.push(`password=${account.id}`);
      proxy.push(`udp-relay=true`);
      proxy.push(`skip-cert-verify=${account.skipCertVerify}`);
      proxy.push(`sni=${account.sni || account.host}`);

      if (account.network == "ws") {
        proxy.push(`ws=true`);
        proxy.push(`ws-path=${account.path}`);
        proxy.push(`ws-headers=Host:${account.host}`);
      }

      return proxy.join(",");
    }
  }

  // Convert to url
  from() {
    let account = this.account;
    let trojan: TrojanInterface = {
      security: account.tls ? "tls" : "",
    } as TrojanInterface;
    if (account.type) trojan.type = account.type;
    if (account.path) trojan.path = account.path;
    if (account.host) trojan.host = account.host;
    if (account.tls) {
      if (account.sni || account.host) {
        trojan.sni = account.sni || account.host;
      }
    }

    return `${account.vpn}://${account.id}@${account.address}:${account.port}?${new URLSearchParams(
      trojan as any
    ).toString()}#${encodeURIComponent(account.remark)}`;
  }
}

export { Trojan };
