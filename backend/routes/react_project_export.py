"""Package generated React/Babel HTML into a portable Vite + React + Tailwind project."""
import html
import json
import re
from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

from bs4 import BeautifulSoup


class UnsupportedReactExport(ValueError):
    """The preview cannot safely be converted into a Vite project."""


def make_react_project(index_html: str, assets: list) -> bytes:
    soup = BeautifulSoup(index_html, "html.parser")
    scripts = soup.find_all("script", attrs={"type": re.compile(r"^(text/babel|text/jsx)$", re.I)})
    if len(scripts) != 1:
        raise UnsupportedReactExport("React Project export requires exactly one JSX/Babel script.")
    script = scripts[0]
    source = script.string or script.get_text()
    if not re.search(r"(?:function|const)\s+App\b", source):
        raise UnsupportedReactExport("Could not find an App component in the generated JSX.")

    mounts = [
        r"ReactDOM\.createRoot\(\s*document\.getElementById\(\s*(['\"])root\1\s*\)\s*\)\.render\(\s*<App\s*/>\s*\)\s*;?",
        r"ReactDOM\.render\(\s*<App\s*/>\s*,\s*document\.getElementById\(\s*(['\"])root\1\s*\)\s*\)\s*;?",
    ]
    found = False
    for pattern in mounts:
        source, count = re.subn(pattern, "", source)
        if count:
            found = True
            break
    if not found:
        raise UnsupportedReactExport("Could not recognize ReactDOM bootstrap; use HTML export.")
    if re.search(r"\bimport\s+.*?\bfrom\s+['\"](?!react['\"])", source):
        raise UnsupportedReactExport("JSX imports third-party packages and needs manual migration.")
    source = 'import * as React from "react";\n' + source.strip() + '\n\nexport default App;\n'

    head = soup.head
    title = head.title.get_text(strip=True) if head and head.title else "AI Website Rebuilder"
    links = []
    if head:
        for tag in head.find_all("link"):
            if "stylesheet" in tag.get("rel", []) and tag.get("href", "").startswith("https://fonts.googleapis.com/"):
                links.append(str(tag))
    body_class = " ".join(soup.body.get("class", [])) if soup.body else ""
    extra_css = "\n".join(x.get_text() for x in soup.find_all("style"))
    css = "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n" + extra_css + "\n"
    page = ('<!doctype html>\n<html lang="en">\n<head>\n'
            '<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
            f'<title>{html.escape(title)}</title>\n' + "\n".join(links) + "\n"
            '</head>\n<body' + (f' class="{html.escape(body_class, quote=True)}"' if body_class else "") + '>\n'
            '<div id="root"></div><script type="module" src="/src/main.jsx"></script>\n</body></html>\n')
    main = 'import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App.jsx";\nimport "./index.css";\ncreateRoot(document.getElementById("root")).render(<App />);\n'
    package = {
        "name": "ai-website-export", "private": True, "version": "1.0.0", "type": "module",
        "scripts": {"dev": "vite --host 0.0.0.0", "build": "vite build", "preview": "vite preview"},
        "dependencies": {"react": "^18.3.1", "react-dom": "^18.3.1"},
        "devDependencies": {"vite": "^6.4.1", "@vitejs/plugin-react": "^4.7.0", "tailwindcss": "^3.4.17", "postcss": "^8.4.49", "autoprefixer": "^10.4.20"}
    }
    files = {
        "index.html": page,
        "src/App.jsx": source,
        "src/main.jsx": main,
        "src/index.css": css,
        "package.json": json.dumps(package, indent=2) + "\n",
        "vite.config.js": 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()] });\n',
        "tailwind.config.js": '/** @type {import("tailwindcss").Config} */\nexport default { content: ["./index.html", "./src/**/*.{js,jsx}"], theme: { extend: {} }, plugins: [] };\n',
        "postcss.config.js": 'export default { plugins: { tailwindcss: {}, autoprefixer: {} } };\n',
        ".gitignore": "node_modules/\ndist/\n.env\n.env.*\n!.env.example\n",
        "README.md": '# Exported React + Tailwind Project\n\nRequires Node.js 20+.\n\nRun `npm install` then `npm run dev`. To build for deployment, run `npm run build`.\n\nGenerated code and third-party assets require review before deployment.\n',
    }
    data = BytesIO()
    with ZipFile(data, "w", ZIP_DEFLATED) as archive:
        for path, value in files.items():
            archive.writestr(path, value)
        for asset in assets:
            if asset.path.startswith("assets/") and ".." not in asset.path.split("/"):
                archive.writestr("public/" + asset.path, asset.content)
    return data.getvalue()
