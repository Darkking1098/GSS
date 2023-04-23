((factory) => {
    factory();
})(() => {
    function getCol(val) {
        let raw = val.substr(5).split("-");
        let c = grapple.gss.color[raw[0]] + "," + (raw[1] || 100) / 100;
        return `rgba(${c})`;
    }
    /* Loading external stylesheets*/
    const EXTERNAL = $(`link[rel="gss/stylesheet"]`);
    /* Loading internal stylesheets*/
    const INTERNAL = "";
    /** Default container to insert style */
    let CONTAINER = document.createElement("style");
    document.head.appendChild(CONTAINER);
    /* Extra Styles */
    let STYLES = [];
    let MAX_SIZE = {};
    let MIN_SIZE = {};
    let EXTRA = [];
    /** RegEx to match tabs and spaces */
    const REG = /^( {4}|\t)/;
    const COL_REG = /@col\/([^ ,\)]+)/;

    /** Fetching data from external gss files */
    EXTERNAL.forEach((sheet) => {
        ajax({ url: sheet.href, success: (res) => __init__(res) });
    });
    function __init__(sheet) {
        /* Getting Data  ready for processing */
        let data = sheet
            .replace(/\t/g, "    ")
            .replace(/##(.*?)##/gs, "")
            .split("\r\n")
            .filter((x) => {
                if (x.trim()) return x;
            });
        create_clusters(data).forEach((data) => {
            render(data);
        });
        STYLES.forEach((data) => {
            let text = toStr(data);
            deploy(text);
        });
        grapple.gss.style = [...grapple.gss.styles, ...STYLES];
        STYLES = [];
        Object.keys(MAX_SIZE).forEach((k) => {
            let text = `@media screen and (max-width:${k}px){`;
            MAX_SIZE[k].forEach((e) => (text += toStr(e)));
            text += "}";
            deploy(text);
        });
        Object.keys(MIN_SIZE).forEach((k) => {
            let text = `@media screen and (min-width:${k}px){`;
            MIN_SIZE[k].forEach((e) => (text += toStr(e)));
            text += "}";
            deploy(text);
        });
        EXTRA.forEach((elem) => {
            text = elem.shift() + "{";
            elem = elem.map((x) => x.replace(REG, ""));
            create_clusters(elem).forEach((elem) => {
                render(elem);
            });
            STYLES.forEach((data) => {
                text += toStr(data);
            });
            STYLES = [];
            deploy(text);
        });
        EXTRA = [];
    }
    function create_clusters(data) {
        data.push("");
        let [groups, cluster] = [[], []];
        while (data.length > 0) {
            let line = data.shift();
            if (!line.match(REG) && cluster.length > 0) {
                if (cluster[0].startsWith("@")) {
                    resolve_special(cluster);
                } else {
                    let x = create_group(cluster);
                    groups = [...groups, ...x];
                }
                cluster = [];
            }
            cluster.push(line);
        }
        return groups;
    }
    function create_group(cluster) {
        let r = [];
        let elem = resolve_selector(cluster.shift());
        cluster = cluster.map((x) => x.replace(REG, ""));
        while (cluster.length > 0) {
            let d = cluster[0];
            if (!d.match(/^[:&]/) && /:/.test(d.substr(1))) {
                elem.props.push(d.split(":").map((x) => x.trim()));
                cluster.shift();
            } else break;
        }
        r.push(elem);
        if (cluster.length > 0)
            r = [...r, ...checkChild(cluster, elem.selector)];
        return r;
    }
    function checkChild(child, parent) {
        parent = parent.trim();
        for (let i = 0; i < child.length; i++) {
            let n = child[i];
            console.log("--", n);
            if (!REG.test(n)) {
                if (n.startsWith("&")) n = parent + n.substr(1);
                else if (n.startsWith(":")) n = parent + n;
                else n = parent + " " + n;
            }
            console.log("->", n);
            child[i] = n;
        }
        return create_clusters(child);
    }
    function resolve_special(cluster) {
        sel = cluster[0].trim();
        if (sel == "@def") {
            cluster.shift();
            for (let i = 0; i < cluster.length; i++) {
                let b = cluster[i].split(":");
                grapple.gss.def[b[0].trim()] = b[1].split(",");
            }
        } else if (sel == "@color") {
            cluster.shift();
            for (let i = 0; i < cluster.length; i++) {
                let b = cluster[i].split(":");
                let bigint = parseInt(b[1].substr(1), 16);
                let r = (bigint >> 16) & 255;
                let g = (bigint >> 8) & 255;
                let bl = bigint & 255;
                grapple.gss.color[b[0].trim()] = r + "," + g + "," + bl;
            }
        } else {
            EXTRA.push(cluster);
        }
    }
    function resolve_selector(selector) {
        let [raw_selector, props, extend] = ["", [], []];
        if (selector.includes("++")) {
            raw_selector = selector.match(/(.*)\+\+(.*)/);
            selector = raw_selector[1].trim();
            extend = raw_selector[2].split(",").map((x) => x.trim());
        }
        if (selector.includes("@") && !selector.startsWith("@")) {
            let defs = selector.split("@");
            selector = defs.shift().trim();
            props.push(...defs.map((c) => ("@" + c).split("-")));
        }
        return { selector, props, extend };
    }
    function render(data) {
        let elem = { node: data.selector, props: {} };
        elem.extend = data.extend;
        let x,
            extra = [];
        data.props.forEach(([prop, val]) => {
            while ((x = val.match(COL_REG))) {
                val = val.replace(COL_REG, getCol(x[0]));
            }
            let props = prop.startsWith("@")
                ? grapple.gss.def[prop.substr(1)]
                : [prop];
            let vals = val.trim().split(" @");
            if (vals[0].startsWith("@")) {
                val = "";
                vals[0] = vals[0].substr(1);
            } else {
                val = vals.shift();
            }
            props.forEach((p) => {
                if (val) elem.props[p] = val;
            });
            if (vals.length > 0) extra.push([props, vals]);
        });
        addStyle(elem);
        if (extra.length > 0) {
            extra.forEach((e) => {
                resolve_vals(elem.node, e);
            });
        }
    }
    function addStyle(elem) {
        let p = false;
        STYLES.forEach((style) => {
            if (elem.extend.includes(style.node)) {
                elem.props = { ...style.props, ...elem.props };
                elem.extend.splice(elem.extend.indexOf(style.node), 1);
            } else if (style.node == elem.node) {
                style.props = { ...style.props, ...elem.props };
                p = true;
            }
        });
        if (elem.extend.length > 0) {
            resolve_size_extend(elem);
        }
        // if (elem.extend) delete elem.extend;
        if (!p) STYLES.push(elem);
    }
    function resolve_size_extend(elem) {
        console.log(elem);
        elem.extend.forEach((ext) => {
            let x = ext.split("-");
            let props;
            STYLES.forEach((style) => {
                if (x[2] == style.node) {
                    props = style.props;
                }
            });
            console.log(props);
            let el = { props };
            if (x[0] == "@max") {
                if (!MAX_SIZE[x[1]]) MAX_SIZE[x[1]] = [];
                el.node = elem.node;
                MAX_SIZE[x[1]].push(el);
            } else if (x[0] == "@min") {
                if (!MIN_SIZE[x[1]]) MIN_SIZE[x[1]] = [];
                el.node = elem.node;
                MIN_SIZE[x[1]].push(el);
            }
            console.log(MAX_SIZE);
            console.log(MIN_SIZE);
        });
    }
    function resolve_vals(selector, [prop, data]) {
        let elem = { props: {} };
        data.forEach((d) => {
            let x = d.split("-");
            if (x[0] == "h") {
                elem.node = selector + ":hover";
                elem.extend = [];
                prop.forEach((p) => {
                    elem.props[p] = x[1];
                });
                addStyle(elem);
            } else if (x[0] == "max") {
                if (!MAX_SIZE[x[1]]) MAX_SIZE[x[1]] = [];
                elem.node = selector;
                prop.forEach((p) => {
                    elem.props[p] = x[2];
                });
                MAX_SIZE[x[1]].push(elem);
            } else if (x[0] == "min") {
                if (!MIN_SIZE[x[1]]) MIN_SIZE[x[1]] = [];
                elem.node = selector;
                prop.forEach((p) => {
                    elem.props[p] = x[2];
                });
                MIN_SIZE[x[1]].push(elem);
            }
        });
    }
    function toStr(elem) {
        let text = "";
        text += elem.node + "{";
        let keys = Object.keys(elem.props);
        for (let i = 0; i < keys.length; i++) {
            text += keys[i] + ":" + elem.props[keys[i]] + ";";
        }
        text += "}";
        return text;
    }
    function deploy(text) {
        CONTAINER.append(text);
    }
});
