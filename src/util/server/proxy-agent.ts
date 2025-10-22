import isClient from '../client/is-client';

type ProxyAgent = () => Promise<{ agent?: any }>;

// Setting http_proxy in env will inject a proxy agent header and disable certificate verification
const proxyAgent: ProxyAgent = async () => {
  const proxyUri = !isClient() && process.env.http_proxy;
  if (proxyUri) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    if ((globalThis as any).fallbackFetch) {
      // https://www.npmjs.com/package/node-fetch#custom-agent
      // NOTE: This uses the HttpsProxyAgent class from https-proxy-agent v7.x
      // Will break in v8+ where only a default factory function is exported
      const { HttpsProxyAgent } = await import('https-proxy-agent');
      return { agent: new HttpsProxyAgent(proxyUri) };
    } else {
      // EnvHttpProxyAgent automatically reads the proxy configuration from the
      // environment variables http_proxy, https_proxy, and no_proxy and sets up
      // the proxy agents accordingly. When http_proxy and https_proxy are set,
      // http_proxy is used for HTTP requests and https_proxy is used for HTTPS requests.
      // If only http_proxy is set, http_proxy is used for both HTTP and HTTPS requests.
      // If only https_proxy is set, it is only used for HTTPS requests.
      // https://undici.nodejs.org/#/docs/api/EnvHttpProxyAgent.md
      const { EnvHttpProxyAgent } = await import('undici');
      return { dispatcher: new EnvHttpProxyAgent() };
    }
  }
  return {};
};

export default proxyAgent;
