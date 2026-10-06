import urllib.request
import urllib.error
import json
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://localhost:3000'

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, {'raw': content}

def run_owasp_bac_check():
    print("=" * 70)
    print("🛡️  OWASP A01:2021 — BROKEN ACCESS CONTROL SECURITY AUDIT")
    print("    Target: IT Service Desk (project-cybersec-69)")
    print("=" * 70)

    # 1. Setup Actors
    # Admin
    status, res = request('POST', '/admin/login', {
        'email': 'x_napaen@hotmail.com',
        'password': '@xZ0041105',
        'rememberMe': False
    })
    admin_token = res.get('data', {}).get('token')
    print(f"\n[ACTOR 1] Admin Authenticated: HTTP {status} (Role: ADMIN)")

    # Employee 1 (Victim / Creator)
    status, res = request('POST', '/api/auth/local', {
        'identifier': 'employee@example.com',
        'password': 'password123'
    })
    emp1_token = res.get('jwt')
    emp1_id = res.get('user', {}).get('id')
    print(f"[ACTOR 2] Employee 1 (Victim) Authenticated: HTTP {status} (ID: {emp1_id})")

    # Employee 2 (Attacker / Unauthorized peer)
    status, res = request('POST', '/api/auth/local', {
        'identifier': 'employee1@servicedesk.local',
        'password': 'Password123!'
    })
    emp2_token = res.get('jwt')
    emp2_id = res.get('user', {}).get('id')
    print(f"[ACTOR 3] Employee 2 (Attacker) Authenticated: HTTP {status} (ID: {emp2_id})")

    # IT Support
    status, res = request('POST', '/api/auth/local', {
        'identifier': 'support@servicedesk.local',
        'password': 'Password123!'
    })
    it_token = res.get('jwt')
    print(f"[ACTOR 4] IT Support Authenticated: HTTP {status} (Role: IT_SUPPORT)")

    # Get a Category
    status, categories = request('GET', '/api/categories', token=admin_token)
    cat_id = categories[0]['id'] if categories else None

    # Employee 1 creates a private Ticket
    status, emp1_ticket = request('POST', '/api/tickets', {
        'title': 'ความลับทางการเงิน: ปัญหาคอมพิวเตอร์แผนกบัญชี',
        'description': 'ไฟล์งบประมาณไตรมาส 4 เปิดไม่ได้ กรุณาช่วยตรวจสอบเฉพาะเจ้าหน้าที่ที่เกี่ยวข้อง',
        'categoryId': cat_id,
        'priority': 'HIGH'
    }, token=emp1_token)
    ticket_id = emp1_ticket['id']
    print(f"\n[TEST ASSET] Employee 1 created private Ticket ID: {ticket_id}")

    test_results = []

    def assert_blocked(test_num, name, expected_code, actual_code, resp_body):
        passed = (actual_code == expected_code)
        icon = "✅ PASS" if passed else "❌ FAIL (VULNERABLE)"
        test_results.append({
            'num': test_num,
            'name': name,
            'expected': expected_code,
            'actual': actual_code,
            'passed': passed
        })
        print(f"\n{icon} | Test {test_num}: {name}")
        print(f"       Expected HTTP: {expected_code} | Received: {actual_code}")
        msg = resp_body.get('message', str(resp_body))
        print(f"       Security Response: {msg}")

    print("\n" + "-" * 70)
    print("SECTION A: VERTICAL PRIVILEGE ESCALATION (ยกระดับสิทธิ์ข้ามระดับ)")
    print("-" * 70)

    # Test 1: Unauthenticated request to Admin Profile
    s, r = request('GET', '/admin/users/me')
    assert_blocked("A.1", "ผู้ใช้ไม่ล็อกอิน (Public) พยายามเข้าถึง /admin/users/me", 401, s, r)

    # Test 2: Employee attempts to view Admin Profile
    s, r = request('GET', '/admin/users/me', token=emp1_token)
    assert_blocked("A.2", "Employee พยายามเข้าถึง /admin/users/me (Admin Profile)", 403, s, r)

    # Test 3: Employee attempts to modify Roles & Permissions matrix
    s, r = request('PUT', '/api/users-permissions/roles/public', {
        'permissions': {'category': {'delete': True}}
    }, token=emp1_token)
    assert_blocked("A.3", "Employee พยายามแก้สิทธิ์ Roles & Permissions Matrix", 403, s, r)

    # Test 4: Employee attempts to Create Category (Only ADMIN & IT_SUPPORT)
    s, r = request('POST', '/api/categories', {
        'name': 'Hacked Category',
        'description': 'Created by unauthorized employee'
    }, token=emp1_token)
    assert_blocked("A.4", "Employee พยายามสร้างหมวดหมู่ใหม่ (POST /api/categories)", 403, s, r)

    # Test 5: Employee attempts to Delete Category
    s, r = request('DELETE', f'/api/categories/{cat_id}', token=emp1_token)
    assert_blocked("A.5", "Employee พยายามลบหมวดหมู่ (DELETE /api/categories/:id)", 403, s, r)

    # Test 6: IT Support attempts to Delete Category (Only ADMIN)
    s, r = request('DELETE', f'/api/categories/{cat_id}', token=it_token)
    assert_blocked("A.6", "IT Support พยายามลบหมวดหมู่ (จำกัดเฉพาะ ADMIN)", 403, s, r)

    # Test 7: Registration of duplicate Admin (Single Admin Policy)
    s, r = request('POST', '/admin/register-admin', {
        'firstname': 'Hacker',
        'lastname': 'Admin',
        'email': 'hacker@admin.com',
        'password': 'Password123!'
    })
    assert_blocked("A.7", "พยายามสมัคร Admin คนที่ 2 (ฝ่าฝืน Single Admin Policy)", 400, s, r)

    print("\n" + "-" * 70)
    print("SECTION B: HORIZONTAL PRIVILEGE ESCALATION / IDOR (เข้าถึงข้อมูลผู้อื่น)")
    print("-" * 70)

    # Test 8: Employee 2 attempts to VIEW Employee 1's private ticket (IDOR Read)
    s, r = request('GET', f'/api/tickets/{ticket_id}', token=emp2_token)
    assert_blocked("B.1", "Employee 2 พยายามแอบดูตั๋วของ Employee 1 (IDOR Read)", 403, s, r)

    # Test 9: Employee 2 attempts to EDIT Employee 1's ticket (IDOR Write)
    s, r = request('PUT', f'/api/tickets/{ticket_id}', {
        'title': 'ตั๋วนี้ถูกแก้ไขโดยแฮกเกอร์ Employee 2'
    }, token=emp2_token)
    assert_blocked("B.2", "Employee 2 พยายามแก้ไขตั๋วของ Employee 1 (IDOR Write)", 403, s, r)

    # Test 10: Employee 1 attempts to change ticket status to RESOLVED (Unauthorized State Transition)
    s, r = request('PUT', f'/api/tickets/{ticket_id}', {
        'status': 'RESOLVED'
    }, token=emp1_token)
    assert_blocked("B.3", "Employee 1 (ผู้แจ้ง) พยายามกดปิด/เปลี่ยนสถานะตั๋วด้วยตนเอง", 403, s, r)

    # Test 11: Employee 2 attempts to DELETE Employee 1's ticket (IDOR Delete)
    s, r = request('DELETE', f'/api/tickets/{ticket_id}', token=emp2_token)
    assert_blocked("B.4", "Employee 2 พยายามลบตั๋วของ Employee 1 (IDOR Delete)", 403, s, r)

    print("\n" + "-" * 70)
    print("SECTION C: DATA FILTERING & MULTI-TENANCY SCOPING (การจำกัดขอบเขตข้อมูล)")
    print("-" * 70)

    # Test 12: Employee 2 listing tickets does NOT see Employee 1's private ticket
    s, emp2_tickets = request('GET', '/api/tickets', token=emp2_token)
    found_in_emp2 = any(t['id'] == ticket_id for t in emp2_tickets)
    passed_c1 = (not found_in_emp2)
    test_results.append({
        'num': "C.1",
        'name': "Employee 2 ดูรายการตั๋วทั้งหมด จะต้องไม่เห็นตั๋วของ Employee 1",
        'expected': "Hidden (Filtered)",
        'actual': "Visible" if found_in_emp2 else "Hidden (Filtered)",
        'passed': passed_c1
    })
    icon = "✅ PASS" if passed_c1 else "❌ FAIL"
    print(f"\n{icon} | Test C.1: Employee 2 ดูรายการตั๋วทั้งหมด จะต้องไม่เห็นตั๋วของ Employee 1")
    print(f"       Employee 2 เห็นตั๋วทั้งหมด: {len(emp2_tickets)} ใบ | พบตั๋วของ Employee 1 หรือไม่: {found_in_emp2}")

    # Test 13: Authorized Admin CAN view Employee 1's ticket
    s, admin_view = request('GET', f'/api/tickets/{ticket_id}', token=admin_token)
    passed_c2 = (s == 200)
    test_results.append({
        'num': "C.2",
        'name': "Super Admin มีสิทธิ์เข้าถึงและตรวจสอบตั๋วของพนักงานทุกคนได้",
        'expected': 200,
        'actual': s,
        'passed': passed_c2
    })
    icon = "✅ PASS" if passed_c2 else "❌ FAIL"
    print(f"\n{icon} | Test C.2: Super Admin มีสิทธิ์เข้าถึงและตรวจสอบตั๋วของพนักงานทุกคนได้")
    print(f"       Expected HTTP: 200 | Received: {s}")

    # Summary
    total = len(test_results)
    passed_count = sum(1 for t in test_results if t['passed'])
    print("\n" + "=" * 70)
    print(f"🎯 AUDIT SUMMARY: {passed_count}/{total} TESTS PASSED ({(passed_count/total)*100:.1f}%)")
    print("=" * 70)

    if passed_count == total:
        print("🎉 ระบบผ่านการทดสอบ Broken Access Control ตามมาตรฐาน OWASP 100%!")
        print("   - ป้องกัน Vertical Privilege Escalation (Role-based Bypass)")
        print("   - ป้องกัน Horizontal Privilege Escalation (IDOR / BOLA)")
        print("   - ป้องกัน Unauthorized State Transition")
        print("   - บังคับใช้ Single Admin Policy อย่างเข้มงวด")

if __name__ == '__main__':
    run_owasp_bac_check()
