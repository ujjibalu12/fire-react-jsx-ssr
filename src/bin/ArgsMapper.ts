import SmartArg from "smartarg/SmartArg";
import {FireJSX_Version} from "../Globals";

export interface Args {
    //mode
    "--pro"?: boolean,                  //Production mode
    "--export"?: boolean,               //Export
    "--export-fly"?: boolean,           //Export path for on the fly builds
    "--disk"?: boolean,                 //Write to disk instead of memory
    "--ssr"?: boolean,                  //Server Side Render, Enabled when exporting
    //prefix
    "--prefix"?: string,                 //Path Prefix
    "--static-prefix"?: string,          //Static Path Prefix
    //dev server
    "--port"?: number,                  //port for dev server eg 5001,5003
    "--addr"?: string,                  //address for dev server eg 127.0.0.2, 127.0.2.10
    "--disable-gzip"?: boolean,         //Disable gzip
    //conf
    "--conf"?: string,                  //Path to Config file
    //log
    "--verbose"?: boolean,              //Log Webpack Stat
    "--log-mode"?: "silent" | "plain",  //Log Mode. silent(log error only) | plain(Log without styling i.e colors and symbols)
    "--disable-plugins"?: boolean,      //Disable plugins
    //path
    "--pages"?: string,     //pages dir, default : root/src/pages
    "--dist"?: string,      //production dist, default : root/out/dist
    "--fly"?: string,       //cache dir, default : root/out/fly
    _?: string[]
}

export function getArgs(): Args {
    return <Args>new SmartArg<Args>()
        .name("FireJSX")
        .description("The React Framework for SSB, SSR and Serverless technologies")
        // @ts-ignore
        .version(FireJSX_Version)
        //mode
        .option(["-p", "--pro"], Boolean, "use production chunks. NODE_ENV : production")
        .option(["-e", "--export"], Boolean, "export project for distribution")
        .option(["-d", "--disk"], Boolean, "store chunks to disk instead of memory while in dev server")
        .option(["-s", "--ssr"], Boolean, "Server Side Render. Available only with -d and -e")
        .option(["-E", "--export-fly"], Boolean, "export project for distribution and for fly build")
        //prefix
        .option(["--prefix"], String, "Path prefix")
        .option(["--static-prefix"], String, "Static Path prefix")
        //dev server
        .option(["--port"], Number, "port for dev server, default: 5000")
        .option(["--addr"], String, "address for dev server, default: localhost")
        .option(["--disable-gzip"], Boolean, "Disable gzip in dev server")
        //conf
        .option(["-c", "--conf"], String, "path to code config file")
        //logging
        .option(["-V", "--verbose"], Boolean, "print webpack stats on error")
        .option(["-l", "--log-mode"], String, "Log Mode. silent (log errors only) | plain (Log without styling i.e colors and symbols)")
        //plugins
        .option(["--disable-plugins"], Boolean, "disable plugins")
        //paths
        .option(["--pages"], String, "path to pages dir, default : root/src/pages")
        .option(["--dist"], String, "path to dir where build is exported, default : root/out/dist")
        .option(["--fly"], String, "path to dir where fly build is exported, default : root/out/fly")
        .example("firejsx -esp", "export server side rendered production build")
        .example("firejsx -dsp", "write to disk when using dev server with server side rendered production build")
        .smartParse()
}

export function parseArgs(args: Args): Args | never {
    //export fly
    if (args["--export-fly"] && args["--export"])
        throw new Error("flag [-e, --export] are redundant when exporting for fly build. Rerun after removing this flag");

    //check if log mode is valid
    if (args["--log-mode"] && (args["--log-mode"] !== "silent" && args["--log-mode"] !== "plain"))
        throw new Error(`unknown log mode ${args["--log-mode"]}. Expected [ silent | plain ]`)

    //check if disk is not followed by exports
    if (args["--disk"] && (args["--export"] || args["--export-fly"]))
        throw new Error("flags [-d, --disk] are redundant when exporting")

    //ssr only when exporting or disk
    if (args["--ssr"] && !(args["--disk"] || args["--export"] || args["--export-fly"]))
        throw new Error("flags [-s, --ssr] should be accompanied either by flags [-e,--export] or flags [-d, --disk]")

    return args
}
