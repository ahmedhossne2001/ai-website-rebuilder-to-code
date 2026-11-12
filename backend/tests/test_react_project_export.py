"""Tests for opt-in Vite React project export."""
from io import BytesIO
from zipfile import ZipFile

import pytest
from fastapi import HTTPException
from routes.export import ExportRequest, export_code


HTML = """<!doctype html><html><head><title>Hello World</title>
<style>body { font-family: Arial; }</style></head><body class="bg-slate-950">
<div id="root"></div><script type="text/babel">
const { useState } = React;
function App() { const [clicked,setClicked] = useState(false);
return <button onClick={() => setClicked(true)}>Click</button>; }
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
</script></body></html>"""


@pytest.mark.asyncio
async def test_vite_react_export_has_editable_source():
    response = await export_code(ExportRequest(code=HTML, format="react"))
    with ZipFile(BytesIO(response.body)) as z:
        assert {"index.html", "src/App.jsx", "src/main.jsx",
                "src/index.css", "package.json", "vite.config.js",
                "postcss.config.js", "tailwind.config.js", "README.md"} <= set(z.namelist())
        jsx = z.read("src/App.jsx").decode("utf-8")
        assert "export default App" in jsx
        assert "ReactDOM.createRoot" not in jsx
        assert "useState" in jsx
        assert '/src/main.jsx' in z.read("index.html").decode("utf-8")


@pytest.mark.asyncio
async def test_plain_html_export_remains_backward_compatible():
    response = await export_code(ExportRequest(code="<html><body>Hi</body></html>"))
    with ZipFile(BytesIO(response.body)) as z:
        assert z.namelist() == ["index.html"]


@pytest.mark.asyncio
async def test_react_export_rejects_unsupported_html():
    with pytest.raises(HTTPException) as exc:
        await export_code(ExportRequest(code="<html><body>Hi</body></html>", format="react"))
    assert exc.value.status_code == 422
