#/bin/sh
BLDPATH=`dirname $0`
tsc --module commonjs ${BLDPATH}/../webscan.ts
tsc -d ${BLDPATH}/../webscan.ts
tsc --module commonjs ${BLDPATH}/../app.ts
tsc -d ${BLDPATH}/../app.ts
