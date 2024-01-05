let config_file = 'config.json'
let verbose = true;

let log_content = "";
const log = input => {log_content += "\n" + JSON.stringify(input).replaceAll("^\"|\"$", "");}

async function loadConfig () {
    let res = await fetch(config_file);
    log(`Loading config file ${config_file}`)
    return res.json()
}

const loadScript = src => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.onload = resolve
        script.onerror = reject
        script.src = src
        script.async = false
        document.head.append(script)
        log(`Loading script file ${src}`)
    })
}

const loadCSS = src => {
    return new Promise((resolve, reject) => {
        const css = document.createElement('link')
        css.rel = 'stylesheet'
        css.onload = resolve
        css.onerror = reject
        css.href = src
        document.head.append(css)
        log(`Loading CSS ${src}`)
    })
}

const loadModule = src => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.type = 'module'
        script.onload = resolve
        script.onerror = reject
        script.src = src
        // script.async = false
        document.head.append(script)
    })
}


function processContent(){
    log("Processing the content")
    let mm = document.querySelectorAll('.mixmarkdown')
    console.log(mm)
    for (const div of mm) {
        let txt = div.innerHTML;
        log(txt)
        // Remove all leading space at the start of a line
        txt = txt.replaceAll(/\n( )*/g, '\n')
        div.innerHTML = marked.parse(txt);
        div.style.visibility = "visible"
    }
}

function generateNav(config) {
    let menu_top = document.getElementById("menu_top");
    if (!menu_top){ 
        menu_top = document.createElement("div");
        menu_top.setAttribute("id", "menu_top");
        document.body.insertBefore(menu_top, document.body.firstChild)
    }
    let menu_bottom = document.getElementById("menu_bottom");
    if (!menu_bottom){ 
        menu_bottom = document.createElement("div");
        menu_bottom.setAttribute("id", "menu_bottom");
        document.body.appendChild(menu_bottom)
    }

    let nav = document.createElement("nav");
    nav.appendChild(document.createTextNode("Menu: "));
    let pages = config["pages"];
    for (const p in pages) {
        let ref = pages[p];
        let title = pages[p];
        let split = pages[p].split(":");
        if (split.length > 1) {
             title = pages[p].split(":")[0];
             ref = pages[p].split(":")[1];
        }
        let link = document.createElement("a");
        link.setAttribute("href", ref + ".html");
        if (window.location.href.split("#")[0].endsWith(ref + ".html")) {
            link.innerHTML = "<b>" + title + "</b>";
        }
        else
            link.innerHTML = title;

        nav.appendChild(link);
        if (p < pages.length - 1)
        nav.appendChild(document.createTextNode(" | "));
    }
    if (menu_top) {
        menu_top.appendChild(nav);
    }
    let nav2 = nav.cloneNode(true);
    if (menu_bottom) {
        menu_bottom.appendChild(nav2);
        menu_bottom.appendChild(document.createElement("br"))
        menu_bottom.appendChild(document.createElement("hr"))

        let source = document.createElement("a");
        source.innerHTML = config["source"]
        source.setAttribute("href", config["source_repo"]);
        source.setAttribute("target", "_blank");
        menu_bottom.appendChild(source);
        menu_bottom.appendChild(document.createTextNode("    -   "))
        let bug_report = document.createElement("a");
        bug_report.innerHTML = "Report bugs or issues"
        bug_report.setAttribute("href", config["source_repo"] + "-/issues");
        bug_report.setAttribute("target", "_blank");
        menu_bottom.appendChild(bug_report);
    }
}


async function build() { 
    let config = await loadConfig();
    let promise_array = [];
    if (config["css"]) promise_array = promise_array.concat(config["css"].map(loadCSS))
    if (config["scripts"]) promise_array = promise_array.concat(config["scripts"].map(loadScript))
    if (config["modules"]) promise_array = promise_array.concat(config["modules"].map(loadModule))
    Promise.all(promise_array)
    .then(() => generateNav(config))
    .then(() => processContent())
    .then(() => document.getElementsByTagName("body")[0].style.visibility = "visible")
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('verbose') && searchParams.get('verbose') === "1") { 
        console.log(log_content)
    }
} 


if (document.readyState !== 'loading') {
    build()
} else {
    document.addEventListener('DOMContentLoaded', function () {
        build();
    });
}
