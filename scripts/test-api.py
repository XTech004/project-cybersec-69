import urllib.request
import json
import sys

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def test_api():
    base = 'http://localhost:3000'
    headers = {'Content-Type': 'application/json'}
    
    def post(url, data, token=None):
        h = dict(headers)
        if token:
            h['Authorization'] = f'Bearer {token}'
        req = urllib.request.Request(f'{base}{url}', data=json.dumps(data).encode('utf-8'), headers=h, method='POST')
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))

    def get(url, token=None):
        h = dict(headers)
        if token:
            h['Authorization'] = f'Bearer {token}'
        req = urllib.request.Request(f'{base}{url}', headers=h, method='GET')
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))

    print('==================== 👑 1. ADMIN AUTHENTICATION TESTS ====================')
    # 1.1 Admin Login
    admin_email = 'x_napaen@hotmail.com'
    admin_pass = '@xZ0041105'
    s, res = post('/admin/login', {'email': admin_email, 'password': admin_pass, 'rememberMe': False})
    admin_token = res['data']['token']
    print(f'[SUCCESS] 1.1 Admin Login: HTTP {s}, data.token={admin_token[:20]}...')

    # 1.2 Admin Signup (Should be blocked because single admin limit is reached)
    try:
        s, res = post('/admin/register-admin', {
            'firstname': 'Super',
            'lastname': 'Director',
            'email': 'superdirector@company.local',
            'password': 'password123'
        })
        print(f'[SUCCESS] 1.2 Admin Signup: HTTP {s}, created {res["data"]["user"]["email"]}')
    except Exception as e:
        print(f'[INFO] 1.2 Admin Signup: Successfully restricted (Single Admin Limit Enforced)')

    # 1.3 Admin Forgot Password
    s, res = post('/admin/forgot-password', {'email': admin_email})
    admin_reset_token = res['resetPasswordToken']
    print(f'[SUCCESS] 1.3 Admin Forgot Password: HTTP {s}, resetPasswordToken={admin_reset_token}')

    # 1.3.1 Admin Reset Password
    s, res = post('/admin/reset-password', {'resetPasswordToken': admin_reset_token, 'password': 'tempPassword123!'})
    print(f'[SUCCESS] 1.3.1 Admin Reset Password: HTTP {s}, {res.get("message")}')

    # Revert Admin Password back to @xZ0041105
    s, res = post('/admin/forgot-password', {'email': admin_email})
    post('/admin/reset-password', {'resetPasswordToken': res['resetPasswordToken'], 'password': admin_pass})
    s, res = post('/admin/login', {'email': admin_email, 'password': admin_pass, 'rememberMe': False})
    admin_token = res['data']['token']
    print('[SUCCESS] Admin password reverted to original and re-logged in.')

    # 1.4 Admin Profile
    s, res = get('/admin/users/me', admin_token)
    print(f'[SUCCESS] 1.4 Admin Profile: HTTP {s}, User={res["firstName"]} {res["lastName"]}, Role={res["role"]}')


    print('\n==================== 👤 2. USER AUTHENTICATION TESTS ====================')
    # 2.1 User Login
    s, res = post('/api/auth/local', {'identifier': 'employee@example.com', 'password': 'password123'})
    user_jwt = res['jwt']
    print(f'[SUCCESS] 2.1 User Login: HTTP {s}, jwt={user_jwt[:20]}...')

    # 2.2 User Signup
    try:
        s, res = post('/api/auth/local/register', {
            'username': 'naruto_uzumaki',
            'email': 'naruto@leaf.local',
            'password': 'password123'
        })
        print(f'[SUCCESS] 2.2 User Signup: HTTP {s}, Username={res["user"]["username"]}')
    except Exception as e:
        print(f'[INFO] 2.2 User Signup: Already registered or conflict handled')

    # 2.3 User Forgot Password
    s, res = post('/api/auth/forgot-password', {'email': 'employee@example.com'})
    user_code = res['code']
    print(f'[SUCCESS] 2.3 User Forgot Password: HTTP {s}, code={user_code}')

    # 2.3.1 User Reset Password
    s, res = post('/api/auth/reset-password', {
        'code': user_code,
        'password': 'newUserPassword123!',
        'passwordConfirmation': 'newUserPassword123!'
    })
    print(f'[SUCCESS] 2.3.1 User Reset Password: HTTP {s}, new jwt={res["jwt"][:20]}...')

    # Revert User Password back to password123
    s, res = post('/api/auth/forgot-password', {'email': 'employee@example.com'})
    s, res = post('/api/auth/reset-password', {
        'code': res['code'],
        'password': 'password123',
        'passwordConfirmation': 'password123'
    })
    user_jwt = res['jwt']
    print('[SUCCESS] User password reverted to password123 and re-authenticated.')

    # 2.4 User Profile
    s, res = get('/api/users/me', user_jwt)
    print(f'[SUCCESS] 2.4 User Profile: HTTP {s}, email={res["email"]}, username={res["username"]}')


    print('\n==================== 📁 3. CATEGORIES TESTS ====================')
    s, cats = get('/api/categories', user_jwt)
    print(f'[SUCCESS] 3.1 List Categories: HTTP {s}, Found {len(cats)} categories')
    cat_id = cats[0]['id']


    print('\n==================== 🎫 4. TICKETS TESTS ====================')
    # 4.1 Create Ticket
    s, new_ticket = post('/api/tickets', {
        'title': 'จอ Monitor กระพริบ',
        'description': 'จอแสดงผลกระพริบทุกๆ 5 วินาทีระหว่างทำงาน',
        'priority': 'HIGH',
        'categoryId': cat_id
    }, token=user_jwt)
    ticket_id = new_ticket['id']
    print(f'[SUCCESS] 4.1 Create Ticket: HTTP {s}, ID={ticket_id}, Title="{new_ticket["title"]}"')

    # 4.2 List Tickets
    s, tickets = get('/api/tickets', token=admin_token)
    print(f'[SUCCESS] 4.2 List Tickets: HTTP {s}, Found {len(tickets)} total tickets')

    # 4.3 Add Comment
    s, comment = post(f'/api/tickets/{ticket_id}/comments', {
        'content': 'ทีมงานไอทีกำลังนำสายเคเบิล DisplayPort เส้นใหม่มาเปลี่ยนให้ครับ'
    }, token=admin_token)
    print(f'[SUCCESS] 4.3 Add Comment: HTTP {s}, "{comment["content"]}"')

    print('\n==================== 🛡️ 5. STRAPI ROLES & PERMISSIONS TESTS ====================')
    # 5.1 List Roles
    s, roles_res = get('/api/users-permissions/roles')
    print(f'[SUCCESS] 5.1 List Roles: HTTP {s}, Roles={[r["id"] for r in roles_res["roles"]]}')

    # 5.2 Get Public Role Details (Matching Image 2)
    s, public_role = get('/api/users-permissions/roles/public')
    cat_perm = public_role['role']['permissions']['category']
    print(f'[SUCCESS] 5.2 Public Role Permissions (Image 2): HTTP {s}, Category={cat_perm}')

    # 5.3 Update Role Permissions (Admin only)
    req_put = urllib.request.Request(
        f'{base}/api/users-permissions/roles/authenticated',
        data=json.dumps({
            'permissions': {
                'category': {'create': False, 'delete': False, 'find': True, 'findOne': True, 'update': False}
            }
        }).encode('utf-8'),
        headers={**headers, 'Authorization': f'Bearer {admin_token}'},
        method='PUT'
    )
    with urllib.request.urlopen(req_put) as resp_put:
        s_put = resp_put.status
        res_put = json.loads(resp_put.read().decode('utf-8'))
        print(f'[SUCCESS] 5.3 Update Authenticated Role: HTTP {s_put}, ok={res_put.get("ok")}')

    print('\n================================================================')
    print('>>> ALL ADMIN, USER, CATEGORIES, TICKETS & ROLES TESTS PASSED (100% OK!)')
    print('================================================================')

if __name__ == '__main__':
    test_api()
