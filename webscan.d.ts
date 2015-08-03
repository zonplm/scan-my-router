/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/q/Q.d.ts" />
export interface RawSshResponse {
    osInfo: string;
    release: string;
    response: string[];
}
export interface WebConnection {
    srcIp: string;
    sport: number;
    srcHost?: string;
    dstIp: string;
    dstHost?: string;
    dport: number;
}
export interface SshClient {
    host: string;
    user: string;
    port: number;
    sshKey: string;
    runCmd: (cmd?: string) => Q.Promise<RawSshResponse>;
}
export interface Callback {
    (error: any, result: any): any;
}
export interface AsyncTaskCallback {
    (item: any, taskcab: (e: any) => void): any;
}
export declare class WebScanner implements SshClient {
    host: string;
    port: number;
    user: string;
    sshKey: string;
    command: string;
    private Summary;
    private lookedUpCount;
    private totalCount;
    connections: WebConnection[];
    private _connections;
    constructor(host: string, port: number, user: string, sshKey: string, command?: string);
    runCmd(cmd?: string): Q.Promise<RawSshResponse>;
    getTcpConnections(cb: (e: any, d: WebConnection[]) => void): void;
    tally(con?: WebConnection): any;
    static lookupHost(ip: string): Q.Promise<string[]>;
    private static parseResponse(output, stderr);
    private static parseTcpline(line);
}
