import json
import base64
import pyodide_js
pyodide_js.loadPackage('cryptography')

from pyscript.js_modules import password

from pyscript import when
from pyscript import document

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

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
        url = f"https://fnwinter.github.io/password/password.html?d={encrypted_b64}"
        
        # Update the fullUrlInput with the generated URL
        full_url_input = document.getElementById('fullUrlInput')
        full_url_input.value = url
        
        print(f"Generated encrypted URL: {url}")
        return url
        
    except Exception as e:
        print(f"Error generating URL: {str(e)}")
        return None

def decryptUrlData(encrypted_b64, master_password):
    try:
        # Decode the base64 encrypted data
        encrypted_data = base64.urlsafe_b64decode(encrypted_b64)
        
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

        # Decrypt the data
        fernet = Fernet(key)
        decrypted_data = fernet.decrypt(encrypted_data)
        
        # Convert to JSON
        decrypted_json = decrypted_data.decode('utf-8')
        decrypted_sites = json.loads(decrypted_json)

        print(f"Decrypted URL data: {decrypted_json}")
        
        # Call JavaScript function to handle the decrypted data
        password.handleDecryptedData(decrypted_json)
        
        return decrypted_sites
        
    except Exception as e:
        print(f"Error decrypting URL data: {str(e)}")
        password.handleDecryptedData(None)
        return None

def decryptData(data, master_password):
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

        # Decrypt the data
        fernet = Fernet(key)
        decrypted_data = fernet.decrypt(data_string.encode('utf-8'))
        
        # Convert to JSON
        decrypted_json = decrypted_data.decode('utf-8')
        decrypted_sites = json.loads(decrypted_json)

        print(f"Decrypted data: {decrypted_sites}")
        return decrypted_sites
        
    except Exception as e:
        print(f"Error decrypting data: {str(e)}")
        return None

if __name__=="__main__":
    print("run on console")
        
