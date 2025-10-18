from pyscript import window
from pyscript import when
from pyscript import document

@when("click", "#call_python")
def test(event):

    my_element = document.querySelector("#call_python")
    window.console.log(my_element.value)
    