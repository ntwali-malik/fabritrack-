# Fabritrack API – Postman test data

**Base URL:** `http://localhost:8080` (or `http://localhost:8081` if you use that port)

**Auth:** For all endpoints except **Sign up** and **Login**, add header:
- **Key:** `Authorization`
- **Value:** `Bearer <your-jwt-token>`

Use the `token` value from the Login or Sign up response.

---

## Test order (create dependencies first)

1. **Sign up** or **Login** → get JWT and user IDs  
2. **Asset categories** and **Locations** (no dependencies)  
3. **Assets** (need category + location)  
4. **All other entities** (need user and/or asset IDs from above)

---

## 1. Auth

### POST /api/users/signup (no auth)
Creates a user and returns `{ "token": "...", "user": { ... } }`.

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@fabritrack.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "role": "ADMIN",
  "department": "IT"
}
```

**Role:** `ADMIN` | `MANAGER` | `EMPLOYEE` | `AUDITOR`  
**Department:** `HR` | `IT` | `FINANCE` | `OPERATIONS` | `MARKETING` | `LEGAL` | `LOGISTICS` | `MANAGEMENT`

### POST /api/users/login (no auth)
Returns `{ "token": "...", "user": { ... } }`.

```json
{
  "email": "john.doe@fabritrack.com",
  "password": "SecurePass123!"
}
```

---

## 2. Asset categories

### POST /api/asset-categories
```json
{
  "name": "Laptops",
  "description": "Portable computers"
}
```

Another:
```json
{
  "name": "Monitors",
  "description": "Display screens"
}
```

---

## 3. Locations

### POST /api/locations
```json
{
  "name": "Building A - Floor 1",
  "building": "Building A",
  "floor": "1",
  "room": "101"
}
```

Another:
```json
{
  "name": "Warehouse North",
  "building": "Warehouse",
  "floor": null,
  "room": "N-02"
}
```

---

## 4. Assets

Use the **category** and **location** `id` from previous responses (e.g. category `1`, location `1`).

### POST /api/assets
```json
{
  "assetTag": "AST-001",
  "name": "Dell Latitude 5520",
  "description": "Company laptop",
  "serialNumber": "SN12345678",
  "purchaseDate": "2023-01-15",
  "purchaseCost": 1200.00,
  "currentValue": 900.00,
  "status": "AVAILABLE",
  "warrantyExpiryDate": "2025-01-15",
  "department": "IT",
  "category": { "id": 1 },
  "location": { "id": 1 }
}
```

**Status:** `AVAILABLE` | `IN_USE` | `UNDER_MAINTENANCE` | `DISPOSED` | `RESERVED`

Another asset:
```json
{
  "assetTag": "AST-002",
  "name": "HP 24-inch Monitor",
  "description": "Office monitor",
  "serialNumber": "HP789",
  "purchaseDate": "2022-06-01",
  "purchaseCost": 250.00,
  "currentValue": 180.00,
  "status": "AVAILABLE",
  "department": "IT",
  "category": { "id": 2 },
  "location": { "id": 1 }
}
```

---

## 5. Users (create – requires auth)

Use when you want to create another user via API (optional; you can use signup instead).

### POST /api/users
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@fabritrack.com",
  "password": "AnotherSecure1!",
  "phone": "+1987654321",
  "status": "ACTIVE",
  "role": "EMPLOYEE",
  "department": "OPERATIONS"
}
```

**Status:** `ACTIVE` | `INACTIVE` | `SUSPENDED`

---

## 6. Asset assignments

Replace `asset.id` and `user.id` with real UUIDs from GET /api/assets and GET /api/users (or from signup/login response).

### POST /api/asset-assignments
```json
{
  "assignedDate": "2024-02-01",
  "returnDate": "2024-12-31",
  "status": "ACTIVE",
  "asset": { "id": "<asset-uuid>" },
  "user": { "id": "<user-uuid>" }
}
```

**Status:** `ACTIVE` | `RETURNED` | `OVERDUE`

---

## 7. Asset movements

Use an existing asset UUID.

### POST /api/asset-movements
```json
{
  "fromLocationName": "Warehouse North",
  "toLocationName": "Building A - Floor 1",
  "reason": "Relocation for new employee",
  "asset": { "id": "<asset-uuid>" }
}
```

---

## 8. Asset reservations

### POST /api/asset-reservations
```json
{
  "startDate": "2024-03-01",
  "endDate": "2024-03-05",
  "purpose": "Training session",
  "status": "PENDING",
  "asset": { "id": "<asset-uuid>" },
  "user": { "id": "<user-uuid>" }
}
```

**Status:** `PENDING` | `APPROVED` | `REJECTED` | `CANCELLED` | `COMPLETED`

---

## 9. Attachments

### POST /api/attachments
```json
{
  "fileName": "warranty-scan.pdf",
  "fileUrl": "https://storage.example.com/docs/warranty-scan.pdf",
  "asset": { "id": "<asset-uuid>" }
}
```

---

## 10. Audit logs

`user` is optional.

### POST /api/audit-logs
```json
{
  "entityName": "Asset",
  "entityId": "<asset-uuid>",
  "action": "CREATE",
  "details": "New asset registered via API",
  "user": { "id": "<user-uuid>" }
}
```

**Action:** `CREATE` | `UPDATE` | `DELETE` | `ASSIGN` | `RETURN` | `MOVE` | `LOGIN` | `LOGOUT`

---

## 11. Comments

### POST /api/comments
```json
{
  "message": "Screen has minor scratch on delivery. Documented for records.",
  "asset": { "id": "<asset-uuid>" },
  "user": { "id": "<user-uuid>" }
}
```

---

## 12. Depreciation records

### POST /api/depreciation-records
```json
{
  "year": 2024,
  "method": "STRAIGHT_LINE",
  "depreciationAmount": 300.00,
  "remainingValue": 600.00,
  "asset": { "id": "<asset-uuid>" }
}
```

**Method:** `STRAIGHT_LINE` | `DECLINING_BALANCE` | `UNITS_OF_PRODUCTION`

---

## 13. Maintenance records

### POST /api/maintenance-records
```json
{
  "type": "PREVENTIVE",
  "description": "Annual hardware check",
  "scheduledDate": "2024-04-01",
  "completedDate": null,
  "cost": null,
  "status": "SCHEDULED",
  "asset": { "id": "<asset-uuid>" }
}
```

**Type:** `PREVENTIVE` | `CORRECTIVE` | `INSPECTION`  
**Status:** `SCHEDULED` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`

---

## 14. Notifications

### POST /api/notifications
```json
{
  "title": "Asset assignment",
  "message": "You have been assigned asset AST-001.",
  "type": "ASSIGNMENT",
  "isRead": false,
  "user": { "id": "<user-uuid>" }
}
```

**Type:** `ASSIGNMENT` | `MAINTENANCE` | `WARRANTY_EXPIRY` | `RESERVATION` | `AUDIT` | `GENERAL`

---

## Quick reference: IDs to replace

| Placeholder       | Get from |
|-------------------|----------|
| `<asset-uuid>`    | POST/GET /api/assets (response `id`) |
| `<user-uuid>`     | POST /api/users/signup or POST /api/users/login (response `user.id`) or GET /api/users |
| Category `id`     | POST/GET /api/asset-categories (e.g. `1`, `2`) |
| Location `id`     | POST/GET /api/locations (e.g. `1`, `2`) |

---

## Example: full flow in Postman

1. **POST** `http://localhost:8080/api/users/signup` with the signup JSON above → copy `token` from response.
2. In **Authorization** tab (or in Headers), set **Bearer Token** = that token (or Header `Authorization`: `Bearer <token>`).
3. **POST** /api/asset-categories with Laptops JSON → note `id` (e.g. 1).
4. **POST** /api/locations with Building A JSON → note `id` (e.g. 1).
5. **POST** /api/assets with the asset JSON, using `"category": { "id": 1 }`, `"location": { "id": 1 }` → note asset `id` (UUID).
6. Use that asset UUID and the user UUID from step 1 for assignments, movements, comments, etc.

All **GET**, **PUT**, and **DELETE** use the same base path, e.g.:
- **GET** /api/assets  
- **GET** /api/assets/{id}  
- **PUT** /api/assets/{id}  
- **DELETE** /api/assets/{id}

Use the same `Authorization: Bearer <token>` for these requests.
