declare type ProxyAgent = () => Promise<{
    agent?: any;
}>;
declare const proxyAgent: ProxyAgent;
export default proxyAgent;
