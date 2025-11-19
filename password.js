"use strict";

//////////////////////////////////////////////////////////////////////////////
// HTML에서 onclick 이벤트로 호출되는 함수들을 전역으로 노출
window.addNewSite = addNewSite;
window.togglePasswordById = togglePasswordById;
window.toggleMasterPasswords = toggleMasterPasswords;
window.generatePasswordById = generatePasswordById;
window.deleteSite = deleteSite;
window.generateUrl = generateUrl;
window.copyToClipboard = copyToClipboard;
window.copyPasswordToClipboard = copyPasswordToClipboard;
window.decryptUrlData = decryptUrlData;
window.closePasswordDialog = closePasswordDialog;
window.handleDecryptedData = handleDecryptedData;
window.onload = function () {
    addNewSite();
    checkUrlForEncryptedData();
}


// Global variables
let allSites = [];

function addNewSite() {
    const newSiteDiv = document.getElementById('site_info');
    const siteCount = newSiteDiv.children.length;

    const newDiv = document.createElement('div');
    newDiv.innerHTML = `
            <label>Site: <input type="text" id="siteInput${siteCount}" placeholder="Enter site name or url" size="30"></label>
            <label>Password: <input type="password" id="passwordInput${siteCount}" placeholder="Enter password"></label>
            <button onclick="togglePasswordById('passwordInput${siteCount}')">👁️</button>
            <button onclick="generatePasswordById('passwordInput${siteCount}')">🔑</button>
            <button onclick="copyPasswordToClipboard('passwordInput${siteCount}')">📋</button>
            <button onclick="deleteSite(${siteCount})">❌</button>
        `;

    newSiteDiv.appendChild(newDiv);
}

function togglePasswordById(inputId) {
    const passwordInput = document.getElementById(inputId);
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
    } else {
        passwordInput.type = 'password';
    }
}

function toggleMasterPasswords() {
    const masterPasswordInput = document.getElementById('masterPasswordInput');
    const confirmMasterPasswordInput = document.getElementById('confirmMasterPasswordInput');
    
    if (masterPasswordInput.type === 'password') {
        masterPasswordInput.type = 'text';
        confirmMasterPasswordInput.type = 'text';
    } else {
        masterPasswordInput.type = 'password';
        confirmMasterPasswordInput.type = 'password';
    }
}

function generatePasswordById(inputId) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById(inputId).value = password;
}

function deleteSite(siteIndex) {
    const siteInfo = document.getElementById('site_info');
    const siteDiv = siteInfo.children[siteIndex];
    
    if (siteDiv) {
    siteDiv.remove();
    
    // Update remaining site indices
    for (let i = siteIndex; i < siteInfo.children.length; i++) {
        const remainingDiv = siteInfo.children[i];
        if (remainingDiv) {
        // Update button onclick attributes
        const buttons = remainingDiv.querySelectorAll('button');
        buttons.forEach(button => {
            const onclick = button.getAttribute('onclick');
            if (onclick) {
            if (onclick.includes('copyPasswordToClipboard')) {
                button.setAttribute('onclick', onclick.replace(/passwordInput\d+/, `passwordInput${i}`));
            } else {
                button.setAttribute('onclick', onclick.replace(/\d+/g, i));
            }
            }
        });
        
        // Update input IDs
        const inputs = remainingDiv.querySelectorAll('input');
        inputs.forEach(input => {
            const oldId = input.id;
            if (oldId.includes('siteInput') || oldId.includes('passwordInput')) {
            const newId = oldId.replace(/\d+/, i);
            input.id = newId;
            }
        });
        }
    }
    }
}

function generateUrl() {
    const fullUrl = document.getElementById('fullUrlInput').value;
    const masterPassword = document.getElementById('masterPasswordInput').value;
    const confirmMasterPassword = document.getElementById('confirmMasterPasswordInput').value;

    if (!masterPassword || !confirmMasterPassword) {
    alert('Please enter both master password fields');
    return;
    }

    if (masterPassword.length < 12) {
    alert('Master password must be at least 12 characters long');
    return;
    }

    if (masterPassword !== confirmMasterPassword) {
    alert('Master passwords do not match');
    return;
    }

    try {
    allSites = [];
    const siteInfo = document.getElementById('site_info');

    for (let i = 0; i < siteInfo.children.length; i++) {
        const siteInput = document.getElementById(`siteInput${i}`);
        const passwordInput = document.getElementById(`passwordInput${i}`);

        if (siteInput && passwordInput && siteInput.value.trim() !== '') {
        allSites.push({
            site: siteInput.value,
            password: passwordInput.value
        });
        }
    }

    py_generateUrl(JSON.stringify(allSites), masterPassword)

    } catch (error) {
    alert('Invalid URL format' + error);
    }
}

function copyToClipboard() {
    const fullUrlInput = document.getElementById('fullUrlInput');
    const textToCopy = fullUrlInput.value;
    
    if (!textToCopy.trim()) {
    alert('No URL to copy.');
    return;
    }
    
    navigator.clipboard.writeText(textToCopy).then(function() {
    alert('URL copied to clipboard!');
    }).catch(function(err) {
    console.error('Clipboard copy failed: ', err);
    alert('Failed to copy to clipboard.');
    });
}

function copyPasswordToClipboard(inputId) {
    const passwordInput = document.getElementById(inputId);
    const textToCopy = passwordInput.value;
    
    if (!textToCopy.trim()) {
    alert('No password to copy.');
    return;
    }
    
    navigator.clipboard.writeText(textToCopy).then(function() {
    alert('Password copied to clipboard!');
    }).catch(function(err) {
    console.error('Clipboard copy failed: ', err);
    alert('Failed to copy to clipboard.');
    });
}

function checkUrlForEncryptedData() {
    const urlParams = new URLSearchParams(window.location.search);
    const encryptedData = urlParams.get('d');
    
    if (encryptedData) {
    // Store the encrypted data for later use
    window.encryptedUrlData = encryptedData;
    // Show password dialog
    const passwordDialog = document.getElementById('passwordDialog');
    passwordDialog.showModal();
    }
}

function decryptUrlData() {
    const masterPassword = document.getElementById('dialogMasterPassword').value;
    
    if (!masterPassword.trim()) {
    alert('Please enter the master password.');
    return;
    }
    
    if (window.encryptedUrlData) {
        // Call Python function to decrypt the data
        py_decryptUrlData(window.encryptedUrlData, masterPassword);
    }
}

function closePasswordDialog() {
    const passwordDialog = document.getElementById('passwordDialog');
    passwordDialog.close();
    // Clear the encrypted data
    window.encryptedUrlData = null;
}

export function handleDecryptedData(decryptedSites) {
    if (decryptedSites == "") {
        alert('Failed to decrypt data. Please check your master password.');
        return
    }

    const jsonArray = JSON.parse(JSON.parse(decryptedSites));

    if (jsonArray && Array.isArray(jsonArray)) {
        // Clear existing sites
        const siteInfo = document.getElementById('site_info');
        siteInfo.innerHTML = '';
        
        // Add decrypted sites
        jsonArray.forEach((site, index) => {
            addNewSite();
            const siteInput = document.getElementById(`siteInput${index}`);
            const passwordInput = document.getElementById(`passwordInput${index}`);

            if (siteInput && passwordInput) {
            siteInput.value = site.site || '';
            passwordInput.value = site.password || '';
            }
        });

        // Close the dialog
        closePasswordDialog();
        alert('Data decrypted and loaded successfully!');
    } else {
        alert('Failed to decrypt data. Please check your master password.');
    }
}

function callPython(function_name, param1, param2, param3) {
    const __callPython = document.getElementById('call_python');
    __callPython.setAttribute('data-value',
    JSON.stringify([function_name, param1, param2, param3]));
    __callPython.click();
}

function py_generateUrl(allSites, masterPassword) {
    callPython("generateUrl", JSON.stringify(allSites), masterPassword);
}

function py_decryptUrlData(encryptedUrlData, masterPassword) {
    callPython("decryptUrlData", encryptedUrlData, masterPassword);
}