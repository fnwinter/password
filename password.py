import pyjokes
import json
from pyscript.web import page
from js import console, createJsonData

def get_joke(event):
    try:
        # JavaScript 함수 createJsonData()를 Python에서 호출
        json_data = createJsonData()
        console.log("JavaScript에서 받은 JSON 데이터:", json_data)
        
        # JSON 데이터를 Python 딕셔너리로 변환
        if isinstance(json_data, str):
            data = json.loads(json_data)
        else:
            data = json_data
        
        # JSON 데이터 정보 표시
        total_passwords = data.get('totalPasswords', 0)
        timestamp = data.get('timestamp', 'Unknown')
        
        # 결과 표시
        result_html = f"""
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <h3>📋 JSON 데이터 정보</h3>
            <p><strong>생성 시간:</strong> {timestamp}</p>
            <p><strong>총 패스워드 개수:</strong> {total_passwords}</p>
            <p><strong>패스워드 목록:</strong></p>
            <ul>
        """
        
        # 패스워드 목록 추가
        for pwd in data.get('passwords', []):
            result_html += f"<li><strong>{pwd.get('site', 'Unknown')}</strong> - {pwd.get('password', 'No password')}</li>"
        
        result_html += """
            </ul>
        </div>
        """
        
        page["div#jokes"].innerHTML = result_html
        
        # 콘솔에 JSON 데이터 로그
        console.log("JSON 데이터:", json.dumps(data, indent=2, ensure_ascii=False))
        
    except Exception as e:
        error_message = f"오류 발생: {str(e)}"
        console.error(error_message)
        page["div#jokes"].innerHTML = f"""
        <div style="padding: 20px; border: 1px solid #ff6b6b; border-radius: 8px; background-color: #ffe0e0;">
            <h3>❌ 오류</h3>
            <p>{error_message}</p>
        </div>
        """

