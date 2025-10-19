from pyscript import window
from pyscript import when
from pyscript import document

@when("click", "#call_python")
def test(event):
    __call_python = document.querySelector("#call_python")
    window.console.log(__call_python.value)

if __name__=="__main__":
    print("run on console")
        
