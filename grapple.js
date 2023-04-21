grapple = {
    E: Element.prototype,
    sTOa: function (text) {
        return typeof text == "string" ? text.split(" ") : text;
    },
    gss: {
        def: [],
        themes: [],
        color: [],
        styles: [],
    },
};
grapple.E.get = grapple.E.getAttribute;
grapple.E.set = grapple.E.setAttribute;
grapple.E.$ = function (select) {
    return this.querySelectorAll(select);
};
$ = (select) => {
    return select[0] == "#" && !/[.:\[ >]/.test(select)
        ? document.getElementById(select.slice(1))
        : document.querySelectorAll(select);
};
HTMLCollection.prototype.perform = NodeList.prototype.perform = function (x) {
    for (let i = 0; i < this.length; i++) x(this[i], i, this);
};
ajax = (reqConfig) => {
    if (!reqConfig.url) {
        console.error("Request url not defined");
        return;
    }
    let xmlObject = new XMLHttpRequest();
    if (!("async" in reqConfig)) reqConfig.async = true;
    let method = (reqConfig.method || "get").toUpperCase();
    xmlObject.timeout = reqConfig.timeout || 0;
    let reqData = new FormData(reqConfig.form);
    if (reqConfig.data) {
        if (method == "GET") {
            reqData = new URLSearchParams(reqConfig.data).toString();
            reqConfig.url = reqConfig.url + "?" + reqData;
        } else {
            for (const key in reqConfig.data)
                reqData.append(key, reqConfig.data[key]);
        }
    }
    if (reqConfig.files) {
        let files = reqConfig.files["docs[]"];
        for (const key in reqConfig.files)
            for (let i = 0; i < files.length; i++)
                reqData.append(key, files[i]);
    }
    xmlObject.open(method, reqConfig.url, reqConfig.async);
    for (const k in reqConfig.headers)
        xmlObject.setRequestHeader(k, reqConfig.headers[k]);
    xmlObject.onloadstart = reqConfig.before;
    xmlObject.onload = () => {
        if (xmlObject.status == 200)
            (reqConfig.success || console.log)(xmlObject.response);
        else if (reqConfig.error) reqConfig.error();
    };
    xmlObject.onabort = reqConfig.abort;
    xmlObject.onerror = reqConfig.error;
    xmlObject.ontimeout = reqConfig.onTimeout;
    xmlObject.onloadend = reqConfig.after;
    xmlObject.upload.onloadstart = reqConfig.beforeUpload;
    xmlObject.upload.onloadend = reqConfig.afterupload;
    xmlObject.upload.onprogress = reqConfig.progress;
    method == "GET" ? xmlObject.send() : xmlObject.send(reqData);
    return xmlObject;
};

grapple.E.hasClass = function (c) {
    return this.classList.contains(c);
};
grapple.E.addClass = function (c, ca) {
    this.classList.add(...grapple.sTOa(c));
    if (ca && typeof ca == "function") ca();
    return this;
};
grapple.E.removeClass = function (c, ca) {
    c == "*"
        ? (this.classList = [])
        : this.classList.remove(...grapple.sTOa(c));
    if (ca && typeof ca == "function") ca();
    return this;
};
grapple.E.toggleClass = function (c, ca) {
    return this.hasClass(c) ? this.removeClass(c, ca) : this.addClass(c, ca);
};
grapple.E.timoutClass = function (c, t = 3000, ca) {
    this.addClass(c);
    setTimeout(() => {
        this.removeClass(c, ca);
    }, t);
};
grapple.E.switchClass = function (a, r, ca) {
    this.removeClass(r);
    this.addClass(a, ca);
    return this;
};

/* Element modification */
grapple.E.addCSS = function (prop, val) {
    if (typeof prop == "object" || val) {
        let x = {};
        val ? (x[prop] = val) : (x = prop);
        for (const k in x) {
            if (/-/.test(k)) this.style.setProperty(k, x[k]);
            this.style[k] = x[k];
        }
    } else this.style = prop;
    return this;
};
grapple.E.addAttr = function (prop, val) {
    if (val) this.setAttribute(prop, val);
    else
        for (const k in prop)
            k.toLowerCase() == "style"
                ? this.addCSS(prop[k])
                : this.setAttribute(k, prop[k]);
    return this;
};
grapple.E.insert = function (l, i) {
    if (!i) return;
    let p = {
        0: "beforebegin",
        1: "afterbegin",
        2: "beforeend",
        3: "afterend",
    };
    if (typeof i == "object") this.insertAdjacentElement(p[l], i);
    else if (i[0] == "<") this.insertAdjacentHTML(p[l], i);
    else this.insertAdjacentHTML(p[l], i);
};
grapple.E.append = function (item) {
    this.insert(2, item);
};
grapple.E.refill = function (item) {
    this.innerHTML = "";
    this.insert(2, item);
};
grapple.E.replace = function (newNode) {
    this.insert(0, newNode);
    this.remove();
};
/* ajax form submittion */
HTMLFormElement.prototype.ajaxSubmit = function (c = {}, r) {
    this.addEventListener("submit", (e) => {
        e.preventDefault();
        c.form = this;
        ajax({ url: this.get("action"), method: this.get("method"), ...c });
    });
};
/* ajax form submittion using button */
HTMLButtonElement.prototype.ajaxSubmit = function (config = {}, reset) {
    this.addEventListener("click", (e) => {
        e.preventDefault();
        this.form.ajaxSubmit(config, reset);
    });
};
/* Localstorage */
localStorage.__proto__.getJson = function (item) {
    return JSON.parse(this.getItem(item));
};
localStorage.__proto__.setJson = function (key, item) {
    return this.setItem(key, JSON.stringify(item));
};
/* grapple Theme */
quickThemes = {
    themes: {
        dark: "#161616",
        light: "#ffffff",
    },
    systemTheme: function () {
        let theme;
        let m = window.matchMedia("(prefers-color-scheme:dark)");
        theme = m.matches ? "dark" : "light";
        m.onchange = function () {
            quickThemes.setTheme(m.matches ? "dark" : "light");
        };
        return theme;
    },
    activateThemes: function () {
        this.currentTheme =
            localStorage.getItem("theme") ||
            document.documentElement.get("data-theme") ||
            this.systemTheme();
        this.setTheme(this.currentTheme);
    },
    setTheme: function (themeName) {
        let x;
        let t = themeName || this.currentTheme;
        document.documentElement.addAttr("data-theme", themeName);
        if ((x = $('meta[name="theme-color"]')[0]))
            x.addAttr("content", this.themes[t]);
        else {
            x = buildElement([
                "meta",
                { name: "theme-color", content: this.themes[t] },
            ]);
            $("head")[0].append(x);
        }
    },
    setDefault: function () {
        localStorage.setItm("theme", this.currentTheme);
    },
    createTheme: function (theme, color) {
        this.themes[theme] = color;
    },
};
function buildElement(elem) {
    let e = document.createElement(elem[0]);
    for (let i = 1; i < elem.length; i++) {
        if (typeof elem[i] == "object" && !(elem[i] instanceof HTMLElement)) {
            elem[i] instanceof Array
                ? e.append(buildElement(elem[i]))
                : e.addAttr(elem[i]);
        } else e.append(elem[i]);
    }
    return e;
}

grapple.E.on = function (event, action) {
    if (!(event in quickEvents)) {
        console.error("Not a valid event");
        return;
    }
    return quickEvents[event](this, action);
};
grapple.E.isVisible = function (limit) {
    let r = this.getBoundingClientRect();
    return (
        r.top + r.height >= limit &&
        r.left + r.width >= limit &&
        r.bottom - r.height <= innerHeight - 2 * limit &&
        r.right - r.width <= innerWidth - 2 * limit
    );
};
quickEvents = {
    viewChange: function (node, action) {
        let oldState = !node.isVisible(150);
        let x = function () {
            let y = node.isVisible(150);
            if (oldState != y)
                action({ node, state: y ? "visible" : "hidden" });
            oldState = y;
        };
        x();
        document.addEventListener("scroll", x);
        return {
            node,
            cancel: () => document.removeEventListener("scroll", x),
        };
    },
    visible: function (node, action) {
        return this.viewChange(node, function (e) {
            if (e.state == "visible") action(e);
        });
    },
    hide: function (node, action) {
        return this.viewChange(node, function (e) {
            if (e.state == "hidden") action(e);
        });
    },
    swipe: function (node, action) {
        let [x, y, diffX, diffY] = [null, null, null, null];
        let direction;
        let ts = (e) => ([x, y] = [e.touches[0].clientX, e.touches[0].clientY]);
        let tm = (e) => e.preventDefault();
        let te = function (e) {
            diffX = e.changedTouches[0].screenX - x;
            diffY = e.changedTouches[0].screenY - y;
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 50) direction = "left";
                else if (diffX < 50) direction = "right";
            } else {
                if (diffY > 50) direction = "down";
                else if (diffY < 50) direction = "up";
            }
            action({ node, direction });
        };
        node.addEventListener("touchstart", ts, false);
        node.addEventListener("touchend", te, false);
        return {
            node,
            cancel: function () {
                node.removeEventListener("touchstart", ts);
                node.removeEventListener("touchmove", tm);
                node.removeEventListener("touchend", te);
            },
        };
    },
    swipeLeft: function (node, action) {
        return this.swipe(node, function (e) {
            if (e.direction == "left") action(e);
        });
    },
    swipeRight: function (node, action) {
        return this.swipe(node, function (e) {
            if (e.direction == "right") action(e);
        });
    },
    swipeUp: function (node, action) {
        return this.swipe(node, function (e) {
            if (e.direction == "up") action(e);
        });
    },
    swipeDown: function (node, action) {
        return this.swipe(node, function (e) {
            if (e.direction == "down") action(e);
        });
    },
};

// Revaluation
grapple.E.quickFill = function (url, data, callback) {
    let t = this;
    ajax({
        url,
        data,
        success: (res) => {
            if (callback) callback(t, res);
            else t.innerHTML = res;
        },
    });
};

/** User events that auto start */
quickThemes.activateThemes();
