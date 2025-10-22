import { isNode } from '../resolve';

type ProxyAgent = () => Promise<{ agent?: any }>;

// Setting http_proxy in env will inject a proxy agent header and disable certificate verification
const proxyAgent: ProxyAgent = async () => {
  const node = isNode();
  const proxyUri =
    (node && typeof process !== 'undefined' && process.env.http_proxy) || false;
  if (proxyUri) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    if (node === 'node') {
      // EnvHttpProxyAgent automatically reads the proxy configuration from the
      // environment variables http_proxy, https_proxy, and no_proxy and sets up
      // the proxy agents accordingly. When http_proxy and https_proxy are set,
      // http_proxy is used for HTTP requests and https_proxy is used for HTTPS requests.
      // If only http_proxy is set, http_proxy is used for both HTTP and HTTPS requests.
      // If only https_proxy is set, it is only used for HTTPS requests.
      // https://undici.nodejs.org/#/docs/api/EnvHttpProxyAgent.md
      const { EnvHttpProxyAgent } = await import('undici');
      return { dispatcher: new EnvHttpProxyAgent() };
    } else {
      // https://www.npmjs.com/package/node-fetch#custom-agent
      // NOTE: This uses the HttpsProxyAgent class from https-proxy-agent v7.x
      // Will break in v8+ where only a default factory function is exported
      const { HttpsProxyAgent } = await import('https-proxy-agent');
      return { agent: new HttpsProxyAgent(proxyUri) };
    }
  }
  return {};
};

export default proxyAgent;
