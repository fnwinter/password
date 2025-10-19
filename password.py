from pyscript import window
from pyscript import when
from pyscript import document
import json
import base64

import pyodide_js
await pyodide_js.loadPackage('cryptography')

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


@when("click", "#call_python")
def __call_python_from_js(event):
    __call_python = document.querySelector("#call_python")
    __value = __call_python.target.getAttribute("data-value")

    __function_name = __value[0]
    __param1 = __value[1]
    __param2 = __value[2]
    __param3 = __value[3]
    print(__function_name)
    print(__param1)
    if __function_name == "generateUrl":
        generateUrl(__param1, __param2)

def generateUrl(data, master_password):
    try:
        # Parse the JSON data
        sites_data = json.loads(data)
        
        # Convert data to string for encryption
        data_string = json.dumps(sites_data)
        
        # Generate encryption key from master password
        password_bytes = master_password.encode('utf-8')
        salt = b'salt_12345'  # In production, use a random salt
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
        
        # Generate URL with encrypted data
        url = f"https://password-manager.com/data?encrypted={encrypted_b64}"
        
        # Update the fullUrlInput with the generated URL
        full_url_input = document.getElementById('fullUrlInput')
        full_url_input.value = url
        
        print(f"Generated encrypted URL: {url}")
        return url
        
    except Exception as e:
        print(f"Error generating URL: {str(e)}")
        return None
    

if __name__=="__main__":
    print("run on console")
        
