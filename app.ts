///<reference path="typings\node\node.d.ts"/>
/**
 * Created by Z-On-_000 on 7/31/2015.
 */
import wc = require('./webscan')
var router = require('./myrouter.json')
var client = new wc.WebScanner(
    router.routerIp,
    router.routerPort,
    router.routerUser,
    router.sshIdent
);

client.getTcpConnections(function(e:any, conns:wc.WebConnection[]){
    console.log(conns);
    console.log(client.tally());
});
