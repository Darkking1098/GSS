grapple.css = [];
grapple.css_def = [];
class gss_render {
    constructor(sheet) {
        this.filter(sheet);
    }
    filter(sheet) {
        // removing comments
        sheet = sheet.replace(/\/\*(.*)\*\//g, " ");
        // reming multiple spaces
        sheet = sheet.replace(/\s\s+/g, "");
        // removing next lines
        sheet = sheet.replace(/(\n|\r)+/g, " ");
        // adding next lines
        sheet = sheet.replace(/}/g, "}\n");
        // removing spaces from each line
        sheet = sheet
            .replace(/\n /g, "\n")
            .replace(/ ?{ ?/g, "{")
            .replace(/ ?} ?/g, "}");
        this.smash(sheet);
    }
    smash(sheet) {
        let sheets = sheet.trim().split("\n");
        let styles = [];
        sheets.forEach((sheet) => {
            let raw_selector = sheet.match(/(.*?){/);
            if (raw_selector[1].includes("extend")) {
                raw_selector = raw_selector[1].match(/(.*)extend(.*)/);
            } else if (raw_selector[1].includes("+")) {
                raw_selector = raw_selector[1].match(/(.*)\+\+(.*)/);
            }
            let selector = raw_selector[1];
            let extended = raw_selector[2] || "";
            let style = sheet.match(/{(.*?)}/)[0];
            let single_style = {
                selector: selector.trim(),
                extended: extended.trim(),
                style: style.trim(),
            };
            styles.push(single_style);
        });
        this.render_styles(styles);
    }
    render_styles(styles) {
        let rendered = [];
        styles.forEach((style) => {
            let css = {};
            style.style
                .substr(1, style.style.length - 2)
                .split(";")
                .forEach((prop) => {
                    if (prop) {
                        let z = prop.split(":");
                        css[z[0].trim()] = z[1].trim();
                    }
                });
            style.style = css;
            rendered.push(style);
        });
        this.render(rendered);
    }
    resolve_extend(styles) {
        let raw_styles = [];
        styles.forEach((style) => {
            let extended_css = style.style;
            let extendd = style.extended.split(",");
            for (let i = 0; i < grapple.css.length; i++) {
                if (extendd.includes(grapple.css[i].selector)) {
                    extended_css = {
                        ...grapple.css[i]["css"],
                        ...extended_css,
                    };
                    extendd.splice(extendd.indexOf(grapple.css[i].selector), 1);
                }
                if (extendd.length === 0) break;
            }
            let ss = { selector: style.selector };
            ss["css"] = extended_css ? extended_css : style.style;
            if (ss.selector == "@def") {
                grapple.css_def = extended_css;
            } else {
                grapple.css.push(ss);
                raw_styles.push(ss);
            }
        });
        return raw_styles;
    }
    resolve_def(styles) {
        styles.forEach((style) => {
            if (style.selector.includes("@")) {
                let defs = style.selector.split("@").map((e) => e.split("-"));
                for (let i = 1; i < defs.length; i++) {
                    let s = grapple.css_def[defs[i][0]].split(',');
                    s.forEach(st => {
                        style.css[st] = defs[i][1];
                    });
                }
                style.selector = defs[0][0];
            }
        });
        return styles;
    }
    render(styles) {
        let raw_styles = this.resolve_extend(styles);
        raw_styles = this.resolve_def(raw_styles);
        this.convert(raw_styles);
    }
    convert(rendered) {
        let str = "";
        rendered.forEach((test_data) => {
            let text = "";
            text += test_data.selector;
            let prop = "{";
            let keys = Object.keys(test_data.css);
            for (let i = 0; i < keys.length; i++) {
                prop += keys[i] + ":" + test_data.css[keys[i]] + ";";
            }
            text += prop + "}\n";
            str += text;
        });
        this.deploy(str);
    }
    deploy(sheet) {
        let container = document.createElement("style");
        container.insert(1, sheet);
        document.head.appendChild(container);
    }
}
(() => {
    let styleSheets = $(`link[rel="gss/stylesheet"]`);
    styleSheets.forEach((sheet) => {
        ajax({
            url: sheet.href,
            success: (res) => {
                new gss_render(res);
            },
        });
    });
})();
