((factory) => {
    factory();
})(() => {
    const EXTERNAL = $(`link[rel="gss/stylesheet"]`);
    const INTERNAL = ""; // Next Update;
    const REG = /^( {4}|\t)/;
    let CONTAINER = document.createElement("style");

    EXTERNAL.forEach((sheet) => {
        ajax({
            url: sheet.href,
            success: (res) => {
                gss_init(res);
            },
        });
    });

    /** Getting inner data or text */
    function gss_init(data) {
        data = data
            .replace(/\t/g, "    ")
            .split("\r\n")
            .filter((x) => x);
        let smashed = smash(data);
        let rendered = render(smashed);
        let final = resolve_ss(rendered);
        console.log(rendered);
    }
    function smash(data) {
        let st = [];
        let raw = [];
        while (data.length > 0) {
            let r = data.shift();
            if (REG.test(r)) {
                raw.push(r);
            } else {
                if (raw.length > 0) {
                    st.push(raw);
                    raw = [];
                }
                raw.push(r);
            }
        }
        st.push(raw);
        return factor(st);
    }
    function factor(data) {
        let final = [];
        data.forEach((d) => {
            let m = refactor(d);
            final.push(m);
        });
        return final;
    }
    function refactor(data) {
        let selector = data.shift().trim();
        let elem = { selector, props: [], child: [] };
        data = data.map((x) => x.replace(REG, ""));
        while (data.length > 0) {
            let d = data[0];
            if (!d.startsWith(":") && /:/.test(d.substr(1))) {
                elem.props.push(d);
                data.shift();
            } else {
                break;
            }
        }
        if (data.length > 0) {
            elem.child = smash(data);
        }
        return elem;
    }
    function render(data) {
        let simplified = [];
        data.forEach((node) => {
            let s = node.selector;
            if (s.startsWith("@")) {
                if (s == "@def") resolve_def(node.props);
                if (s == "@color") resolve_color(node.props);
            } else simplified.push(resolve_selector(node));
        });
        return simplified;
    }
    function resolve_def(defs) {
        for (let i = 0; i < defs.length; i++) {
            let b = defs[i].split(":");
            grapple.gss.def[b[0]] = b[1].split(",");
        }
    }
    function resolve_color(defs) {
        for (let i = 0; i < defs.length; i++) {
            let b = defs[i].split(":");
            let bigint = parseInt(b[1].substr(1), 16);
            let r = (bigint >> 16) & 255;
            let g = (bigint >> 8) & 255;
            let bl = bigint & 255;
            grapple.gss.color[b[0]] = r + "," + g + "," + bl;
        }
    }
    function resolve_val(val) {
        if (val.startsWith("@col/")) {
            let raw = val.substr(5).split("-");
            let c = grapple.gss.color[raw[0]] + "," + (raw[1]||100) / 100;
            return `rgba(${c})`;
        }
        return val;
    }
    function resolve_selector(node) {
        let raw_selector = node.selector;
        let selector,
            extended = [],
            props = {},
            child = [];
        if (node.selector.includes("++")) {
            raw_selector = node.selector.match(/(.*)\+\+(.*)/);
            selector = raw_selector[1].trim();
            extended = raw_selector[2].split(",");
        } else {
            selector = node.selector.trim();
        }
        if (selector.includes("@")) {
            let defs = selector.split("@");
            selector = defs.shift().trim();
            node.props.push(...defs.map((c) => "@" + c.replace("-", ":")));
        }
        node.props.forEach((prop) => {
            [prop, val] = prop.split(":");
            let p = prop.startsWith("@")
                ? grapple.gss.def[prop.substr(1)]
                : prop;
            let v = val.includes("@") ? resolve_val(val, selector) : val;
            props[p] = v.trim();
        });
        for (let j = 0; j < extended.length; j++) {
            grapple.gss.styles.some((el) => {
                if (el.selector == extended[j].trim()) {
                    props = { ...el.props, ...props };
                }
            });
        }
        node.child.forEach((c) => {
            child.push(resolve_selector(c));
        });
        let elem = { selector, props, child };
        grapple.gss.styles.push(elem);
        return elem;
    }
    function resolve_ss(data) {
        let str = "";
        data.forEach((elem) => {
            toStr(elem);
        });
    }
    function toStr(elem, parent) {
        let text = parent || "";
        if (elem.selector.startsWith(":")) text += elem.selector + "{";
        else text += " " + elem.selector + "{";
        let keys = Object.keys(elem.props);
        for (let i = 0; i < keys.length; i++) {
            text += keys[i] + ":" + elem.props[keys[i]] + ";";
        }
        text += "}";
        deploy(text);
        parent=elem.selector;
        elem.child.forEach(elem => {
            toStr(elem, parent);
        });
    }
    function deploy(sheet) {
        CONTAINER.append(sheet);
        document.head.appendChild(CONTAINER);
    }
});
