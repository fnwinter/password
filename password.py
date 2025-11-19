import json
import base64

from cryptography.fernet import Fernet
from cryptography.fernet import InvalidToken
from cryptography.exceptions import InvalidSignature

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from pyscript import when
from pyscript import document
from pyscript import window
from pyscript.js_modules import password_js

try:
    import pyodide_js
    pyodide_js.loadPackage('cryptography')

    @when("click", "#call_python")
    def dispatch_event(event):
        __call_python = document.querySelector("#call_python")
        __value = json.loads(event.target.getAttribute("data-value"))
        
        __function_name = __value[0]
        __param1 = __value[1]
        __param2 = __value[2]
        __param3 = __value[3]
        if __function_name == "generateUrl":
            generateUrl(__param1, __param2)
        elif __function_name == "decryptUrlData":
            decryptUrlData(__param1, __param2)

except Exception as e:
    print(f"Error loading pyodide_js, pyscript package: {str(e)}")

def generateUrl(data, master_password):
    # Parse the JSON data
    sites_data = json.loads(data)
    
    # Convert data to string for encryption
    data_string = json.dumps(sites_data)
    
    # Generate encryption key from master password
    password_bytes = master_password.encode('utf-8')
    salt = b'sugar_0419'  # In production, use a random salt
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password_bytes))
    
    # Encrypt the data
    fernet = Fernet(key)
    encrypted_data = fernet.encrypt(data_string.encode('utf-8'))
    
    # Convert to base64 for URL encoding
    encrypted_b64 = base64.urlsafe_b64encode(encrypted_data).decode('utf-8')
    
    host_name = window.location.hostname

    url = f"https://{host_name}/password/password.html?d={encrypted_b64}"
    
    # Update the fullUrlInput with the generated URL
    try:
        if document is not None:
            full_url_input = document.getElementById('fullUrlInput')
            full_url_input.value = url
        else:
            print("document is not found")
    except Exception as e:
        print(f"Error updating fullUrlInput: {str(e)}")
    return encrypted_b64

def decryptUrlData(encrypted_b64, master_password):
    # Decode the base64 encrypted data
    encrypted_data = base64.urlsafe_b64decode(encrypted_b64)
    
    # Generate encryption key from master password
    password_bytes = master_password.encode('utf-8')
    salt = b'sugar_0419'  # In production, use a random salt
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password_bytes))

    try:
        # Decrypt the data
        fernet = Fernet(key)
        decrypted_data = fernet.decrypt(encrypted_data)

        # Convert to JSON
        decrypted_json = decrypted_data.decode('utf-8')
  
        password_js.handleDecryptedData(decrypted_json)
        
    except Exception as e:

        password_js.handleDecryptedData("")

if __name__=="__main__":
    print("run on console")
    # output = generateUrl("{\"test\": 12}", "test")
    # print(output)
    # print(decryptUrlData(output, "test"))

        
