/// <reference path="typings/node/node.d.ts" />
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
    runCmd: (cb: (e: any, d: RawSshResponse) => void, cmd?: string) => any;
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
    runCmd(cb: (e: any, d: RawSshResponse) => any, cmd?: string): void;
    getTcpConnections(cb: (e: any, d: WebConnection[]) => void): void;
    tally(con?: WebConnection): any;
    private lookupHost(con, cb);
    private parseResponse(output, stderr);
    private parseTcpline(line);
}
