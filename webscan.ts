///<reference path="typings\node\node.d.ts"/>
///<reference path="typings\q\Q.d.ts"/>
/**
 * Created by Z-On-_000 on 7/31/2015.
 */
"use strict";
var Q = require('q');

export interface RawSshResponse {
    osInfo: string;
    release: string;
    response: string [];
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
    runCmd: ( cmd?:string) => Q.Promise<RawSshResponse>
}

export interface Callback {
    (error:any, result:any):any
}

export interface AsyncTaskCallback {
    (item:any, taskcab: (e:any) => void)
}


export class WebScanner implements SshClient {
    private Summary;
    private lookedUpCount: number;
    private totalCount: number;

    public get connections():WebConnection[] {
        return this._connections;
    }

    private _connections:WebConnection[];

    constructor(public host:string, public port:number,
                public user:string, public sshKey:string,
                public command?:string) {
        this.Summary = {}; //tally hosts by each src ip
        this._connections = [];

        //default command is to get active connections
        if (!command) {
            this.command = 'cat /proc/net/ip_conntrack';
        }
    }

    //return a ssh call response promise
    public runCmd( cmd?: string) : Q.Promise<RawSshResponse> {
        var that = this;
        var cp = require('child_process');
        if(cmd) {
            this.command = cmd;
        }
        var defered = Q.defer();
        var cmdline = ['ssh -i', this.sshKey, this.user + '@' + this.host,
            "'" + this.command + "'"].join(' ');
        console.log("running " + cmdline);
        console.log("...");
        cp.exec(cmdline, function (err, stdout, stderr) {
            if (err) {
                defered.reject(err);
            }
            else {
                var sshRsp = WebScanner.parseResponse(stdout, stderr);
                defered.resolve(sshRsp);
            }
        })
        return defered.promise;
    }

    public getTcpConnections(cb:(e:any, d:WebConnection[]) => void) {
        var that = this;
        var async = require('async');

        this.runCmd()
        .then(function (resp:RawSshResponse) {
            console.log(resp.response.length);
            var conns  = resp.response.map(WebScanner.parseTcpline);
            that._connections.push(conns);
            //reverse look up dstHost for each dstIp, only return the first hostname
            that.totalCount = conns.length;
            that.lookedUpCount = 0;
            async.each(conns, function (conn, ecb) {
                    var scanner = that;
                    scanner.lookupHost(conn, function (e, d) {
                        scanner.lookedUpCount++;
                        console.log('\n\nTotal: ' + scanner.totalCount + ' Looked:' + scanner.lookedUpCount);
                        console.log(scanner.tally(conn));
                        ecb(e, d);
                    });
                },
                function (err) {
                    console.log('lookup finished: ' + err);
                });
        },
        function(reason){
            console.log(reason);
        });
    }

    public tally(con?:WebConnection) {
        if (!con) return this.Summary;

        var dst = con.dstHost;
        if (!con.dstHost) {
            dst = con.dstIp;
        }
        if (!this.Summary[con.srcIp]) {
            this.Summary[con.srcIp] = [dst];
        }
        else {
            this.Summary[con.srcIp].push(dst);
        }
        return this.Summary;
    }

    ///conform to async task signature.
    private lookupHost(con:WebConnection, cb:(err, d)=> any) {
        var dns = require('dns');
        if (!con) {
            cb(null,con);
            return;
        }

        try {
            console.log('lookup for ' + con.dstIp);
            dns.reverse(con.dstIp, function (e, result) {
                if (!e) {
                    con.dstHost = result[0];
                    //console.log(con);
                }
                cb(null, con);
            });
        }
        catch (e) {
            //console.log('lookup for ' + con.dstIp + ' Failed');
            console.log(e);
            cb(e, null);
        }
    }

    private static parseResponse(output:string, stderr:string):RawSshResponse {
        var ar = output.split('\n');
        var estr = stderr.split('\n');
        return {
            osInfo: estr[0],
            release: estr[1],
            response: ar.filter(function (s) {
                return s.length > 0;
            })
        };
    }

    private static parseTcpline(line:string):WebConnection {
        //console.log(typeof(line));
        var token = /src=(.+)\sdst=(.+)\ssport=(\d+)\sdport=(\d+)\ssrc/.exec(line);
        //console.log(token);
        if (!token) return null;

        var conn = {
            srcIp: token[1],
            dstIp: token[2],
            sport: parseInt(token[3]),
            dport: parseInt(token[4])
        };
        //console.log(conn);
        return conn;
    }

}
