import {join} from "path"
import FireJSX, {$} from "./SSB"
import * as express from "express";
import * as webpackHot from "webpack-hot-middleware"
import * as mime from "mime"
import * as compression from "compression"

export interface devServerConfig {
    gzip?: boolean          //compress gzip
}

export default class {
    private readonly $: $
    private readonly app: FireJSX;

    constructor(app: FireJSX) {
        this.app = app;
        this.$ = app.$;
    }

    init(port: number = 5000, addr: string = "localhost", config: devServerConfig): express.Application {
        //init server
        const server: express.Application = express();
        //gzip
        if (config.gzip)
            server.use(compression())
        //init plugins
        this.$.hooks.initServer.forEach(initServer => initServer(server))
        //build pages
        this.$.cli.log("Building Pages...")
        this.app.buildPages().catch(e => this.$.cli.error(e))
        //no hmr in production or static rendering
        if (!this.$.pageArchitect.webpackArchitect.proOrSSR)
            server.use(webpackHot(this.$.pageArchitect.compiler, {
                log: false,
                path: `/__webpack_hmr`
            }))
        //routing
        if (this.$.staticDir)
            server.use(this.$.staticPrefix, express.static(this.$.staticDir));
        server.get(`${this.$.prefix}/${this.$.lib}/*`, this.get.bind(this));
        server.get(`${this.$.prefix}/${this.$.lib}/map/*`, this.get.bind(this));
        server.use(`${this.$.prefix}/*`, this.getPage.bind(this));
        //listen
        const listener = server.listen(port, addr, () => {
            // @ts-ignore
            const {port, address} = listener.address();
            if (this.$.cli.mode === "plain")
                this.$.cli.normal(`Listening at http://${address}:${port}`);
            else
                this.$.cli.normal(
                    " \n \x1b[32m┌─────────────────────────────────────────┐\n" +
                    " │                                         │\n" +
                    ` │   Listening at http://${address}:${port}    │\n` +
                    ` │   GZIP : ${config.gzip}                           │\n` +
                    " │                                         │\n" +
                    " └─────────────────────────────────────────┘\x1b[0m\n")
        })

        return server;
    }

    private get(req: express.Request, res: express.Response) {
        if (this.$.verbose)
            this.$.cli.log("Request :", req.url)
        // @ts-ignore
        const pathname = join(this.$.outDir, decodeURI(req._parsedUrl.pathname).replace(this.$.prefix, ""))

        res.contentType(mime.getType(pathname.substr(pathname.lastIndexOf("."))))
        //cache them
        if (this.$.outputFileSystem.existsSync(pathname))
            res.write(this.$.outputFileSystem.readFileSync(pathname));
        else
            res.status(404);
        res.end();
    }

    private getPage(req: express.Request, res: express.Response, next) {
        if (this.$.verbose)
            this.$.cli.log("HTML Request :", req.url)
        // @ts-ignore
        const pathname = decodeURI(req._parsedUrl.pathname).replace(this.$.prefix, "")
        // @ts-ignore
        if (req.method === "GET" && !req._parsedUrl.pathname.startsWith("/__webpack_hmr/"))
            try {
                res.contentType("text/html");
                let path = `${this.$.outDir}/${pathname}`;
                if (this.$.outputFileSystem.existsSync(join(path, "index.html")))
                    res.end(this.$.outputFileSystem.readFileSync(join(path, "index.html")));
                else if (this.$.outputFileSystem.existsSync(path + ".html"))
                    res.end(this.$.outputFileSystem.readFileSync(path + ".html"))
                else {
                    const page404 = this.$.pageMap.get("404.jsx")
                    if (page404)
                        this.$.outputFileSystem.readFile(join(this.$.outDir, "404.html"), (err, data) =>
                            res.end(err ? err.toString() : data))
                    else
                        res.end("<h1>404</h1><p>404.jsx page not found. Link fallback will be unsuccessful</p>")
                }
            } catch (e) {
                this.$.cli.error("Error serving HTML", pathname, e);
                res.status(500);
                res.end(`<h1>500</h1><p>${e}</p>`)
            }
        else
            next()
    }
}
