///<reference path="typings\node\node.d.ts"/>
/**
 * Created by Z-On-_000 on 7/31/2015.
 */
"use strict";
var WebScanner = (function () {
    function WebScanner(host, port, user, sshKey, command) {
        this.host = host;
        this.port = port;
        this.user = user;
        this.sshKey = sshKey;
        this.command = command;
        this.Summary = {}; //tally hosts by each src ip
        this._connections = [];
        //default command is to get active connections
        if (!command) {
            this.command = 'cat /proc/net/ip_conntrack';
        }
    }
    Object.defineProperty(WebScanner.prototype, "connections", {
        get: function () {
            return this._connections;
        },
        enumerable: true,
        configurable: true
    });
    WebScanner.prototype.runCmd = function (cb, cmd) {
        var that = this;
        var cp = require('child_process');
        var callbk = cb;
        if (cmd) {
            this.command = cmd;
        }
        var cmdline = ['ssh -i', this.sshKey, this.user + '@' + this.host,
            "'" + this.command + "'"].join(' ');
        console.log("running " + cmdline);
        console.log("...");
        cp.exec(cmdline, function (err, stdout, stderr) {
            if (err) {
                callbk.call(that, err, stderr);
            }
            else {
                callbk.call(that, null, that.parseResponse(stdout, stderr));
            }
        });
    };
    WebScanner.prototype.getTcpConnections = function (cb) {
        var that = this;
        var async = require('async');
        this.runCmd(function (err, resp) {
            console.log(resp.response.length);
            var conns = resp.response.map(that.parseTcpline);
            that._connections.push(conns);
            //reverse look up dstHost for each dstIp, only return the first hostname
            this.totalCount = conns.length;
            this.lookedUpCount = 0;
            async.each(conns, function (conn, ecb) {
                var scanner = that;
                scanner.lookupHost(conn, function (e, d) {
                    scanner.lookedUpCount++;
                    console.log('\n\nTotal: ' + scanner.totalCount + ' Looked:' + scanner.lookedUpCount);
                    console.log(scanner.tally(conn));
                    ecb(e, d);
                });
            }, function (err) {
                console.log('lookup finished: ' + err);
                cb(err, conns);
            });
        });
    };
    WebScanner.prototype.tally = function (con) {
        if (!con)
            return this.Summary;
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
    };
    ///conform to async task signature.
    WebScanner.prototype.lookupHost = function (con, cb) {
        var dns = require('dns');
        if (!con) {
            cb(null, con);
            return;
        }
        try {
            console.log('lookup for ' + con.dstIp);
            dns.reverse(con.dstIp, function (e, result) {
                if (!e) {
                    con.dstHost = result[0];
                }
                cb(null, con);
            });
        }
        catch (e) {
            //console.log('lookup for ' + con.dstIp + ' Failed');
            console.log(e);
            cb(e, null);
        }
    };
    WebScanner.prototype.parseResponse = function (output, stderr) {
        var ar = output.split('\n');
        var estr = stderr.split('\n');
        return {
            osInfo: estr[0],
            release: estr[1],
            response: ar.filter(function (s) {
                return s.length > 0;
            })
        };
    };
    WebScanner.prototype.parseTcpline = function (line) {
        //console.log(typeof(line));
        var token = /src=(.+)\sdst=(.+)\ssport=(\d+)\sdport=(\d+)\ssrc/.exec(line);
        //console.log(token);
        if (!token)
            return null;
        var conn = {
            srcIp: token[1],
            dstIp: token[2],
            sport: parseInt(token[3]),
            dport: parseInt(token[4])
        };
        //console.log(conn);
        return conn;
    };
    return WebScanner;
})();
exports.WebScanner = WebScanner;
