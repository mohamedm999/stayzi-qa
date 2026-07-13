export const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "admin'--",
  "' OR 1=1 --",
  "'; DROP TABLE users; --",
  "' UNION SELECT * FROM users --",
  "1' AND '1'='1",
  "1' OR '1'='1' /*",
  "'; EXEC xp_cmdshell('dir'); --",
  "' OR ''='",
  "1; SELECT * FROM users",
  "' UNION SELECT null,null,null,null --",
  "') OR ('1'='1",
  "1' OR 1=1 LIMIT 1 --",
];

export const NOSQL_INJECTION_PAYLOADS = [
  { email: { $gt: "" }, password: { $gt: "" } },
  { email: { $ne: null }, password: { $ne: null } },
  { email: { $regex: ".*" }, password: { $gt: "" } },
  { email: "admin", password: { $gt: "" } },
  { email: { $exists: true }, password: { $exists: true } },
  { email: { $in: ["admin@test.com"] }, password: { $gt: "" } },
];

export const XSS_PAYLOADS = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  "<svg onload=alert('XSS')>",
  "javascript:alert('XSS')",
  "<iframe src='javascript:alert(1)'>",
  "'-alert(1)-'",
  "\"><script>alert('XSS')</script>",
  "<body onload=alert('XSS')>",
  "<input onfocus=alert('XSS') autofocus>",
  "<details open ontoggle=alert('XSS')>",
  "{{7*7}}",
  "${7*7}",
  "<%= 7*7 %>",
];

export const COMMAND_INJECTION_PAYLOADS = [
  "; ls",
  "| ls",
  "`ls`",
  "$(ls)",
  "; cat /etc/passwd",
  "| cat /etc/passwd",
  "; whoami",
  "| whoami",
  "; sleep 5",
  "|| sleep 5",
  "`id`",
  "$(id)",
];

export const PATH_TRAVERSAL_PAYLOADS = [
  "../../etc/passwd",
  "..%2F..%2Fetc%2Fpasswd",
  "....//....//etc/passwd",
  "..\\..\\etc\\passwd",
  "%2e%2e%2f%2e%2e%2fetc%2fpasswd",
  "../../../etc/shadow",
  "..%5c..%5cetc%5cpasswd",
  "file:///etc/passwd",
  "....\/....\/etc/passwd",
];

export const LDAP_INJECTION_PAYLOADS = [
  "*)",
  "*)(&)",
  "*",
  "admin*)(&)",
  "*)|(&",
  "(&(uid=*))",
  "*()|&'",
  "'(')|('",
];

export const CRLF_INJECTION_PAYLOADS = [
  "test@test.com\r\nX-Injected-Header: yes",
  "test@test.com%0d%0aX-Injected-Header:%20yes",
  "test@test.com\nX-Injected-Header: yes",
  "test@test.com\r\n\r\n<script>alert(1)</script>",
  "test@test.com%0d%0a%0d%0a<script>alert(1)</script>",
];

export const UNICODE_PAYLOADS = [
  "аdmin@test.com",       // Cyrillic 'а' instead of Latin 'a'
  "аdmin@test.com",       // Cyrillic 'а'
  "admіn@test.com",       // Cyrillic 'і'
  "admin@test.com\u200B", // Zero-width space
  "admin@test.com\uFEFF", // BOM
  "admin@test.com\u0000", // Null byte
  "\u003cscript\u003ealert(1)\u003c/script\u003e",
  "Ωmega@test.com",       // Greek Omega
  "admin@exаmple.com",    // Cyrillic а in domain
];

export const SPECIAL_CHAR_PAYLOADS = [
  "!@#$%^&*()",
  "<>{}|\\[];':\",./?",
  "`~",
  " \t\n\r ",
  "\u0000",
  "true",
  "null",
  "undefined",
  "NaN",
  "1e308",
  "-1",
  "0",
  "[]",
  "{}",
  "''",
  '""',
];

export const LENGTH_BOUNDARY_PAYLOADS = {
  short: ["", " ", "a", "ab"],
  long: [
    "a".repeat(255),
    "a".repeat(256),
    "a".repeat(512),
    "a".repeat(1000),
    "a".repeat(5000),
    "a".repeat(10000),
  ],
};

export const DOUBLE_ENCODING_PAYLOADS = [
  "%2527",          // encoded single quote
  "%253Cscript%253E",
  "%2527%20OR%20%25271%2527%3D%25271",
  "%2522%253E%253Cscript%253Ealert(1)%253C%252Fscript%253E",
  "%2500",
  "%250A",
  "%250D",
];

export const BRUTE_FORCE_PASSWORDS = [
  "password123",
  "12345678",
  "qwerty123",
  "admin123",
  "letmein123",
  "welcome1",
  "monkey123",
  "dragon123",
  "master123",
  "login123",
  "abc12345",
  "password1",
  "123456789",
  "qwerty",
  "11111111",
  "iloveyou1",
  "sunshine1",
  "princess1",
  "football1",
  "shadow123",
];

export const COMMON_BREACHED_PASSWORDS = [
  "123456",
  "password",
  "12345678",
  "qwerty",
  "123456789",
  "12345",
  "1234",
  "111111",
  "1234567",
  "dragon",
];

export const HTTP_METHODS = ["PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

export const CONTENT_TYPE_MISMATCHES = [
  { contentType: "text/plain", body: '{"email":"test@test.com","password":"pass"}' },
  { contentType: "text/html", body: '<form><input name="email" value="test@test.com"></form>' },
  { contentType: "application/xml", body: '<login><email>test@test.com</email><password>pass</password></login>' },
  { contentType: "multipart/form-data", body: "email=test@test.com&password=pass" },
  { contentType: "application/x-www-form-urlencoded", body: "email=test@test.com&password=pass" },
];

export const MALICIOUS_TOKENS = [
  "invalid-token-string",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "Bearer ",
  "",
  "null",
  "undefined",
  "1234567890",
  "a].b].c]",
];
