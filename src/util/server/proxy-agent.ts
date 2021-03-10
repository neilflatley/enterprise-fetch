type ProxyAgent = () => Promise<{ agent?: any }>;

// Setting http_proxy in env will inject a proxy agent header and disable certificate verification
const proxyAgent: ProxyAgent = async () => {
  console.log(`http_proxy: ${process.env.http_proxy}`);
  const proxyUri = process.env.http_proxy || false;
  if (proxyUri) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const { HttpsProxyAgent } = await import('https-proxy-agent');
    return { agent: new HttpsProxyAgent(proxyUri) };
  }
  return {};
};

export default proxyAgent;
