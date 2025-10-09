import pyjokes
from pyscript.web import page
from js import console

def get_joke(event):
    page["div#jokes"].innerHTML = f"{pyjokes.get_joke()} 🥁"
    console.log(event)

