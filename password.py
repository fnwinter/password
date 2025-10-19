from pyscript import window
from pyscript import when
from pyscript import document

@when("click", "#call_python")
def __call_python_from_js(event):
    __call_python = document.querySelector("#call_python")
    __value = event.target.getAttribute("data-value")
    __function_name = __value[0]
    __param1 = __value[1]
    __param2 = __value[2]
    __param3 = __value[3]

    print(__value)

if __name__=="__main__":
    print("run on console")
        
