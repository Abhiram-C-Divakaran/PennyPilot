# PennyPilot Android Notification Ingestion Contract (Phase 3B Specification)

## Overview

In **Phase 3B**, a lightweight native Android service (`NotificationListenerService`) will monitor payment app notifications, parse financial transaction metadata, and forward transactions directly to PennyPilot's central ingestion pipeline.

All budgeting, duplicate detection, merchant normalization, categorization, confidence evaluation, and review workflows are handled on the PennyPilot backend. The Android client's sole role is: **Detect -> Parse -> Send**.

---

## Endpoint Specification

- **Method**: `POST`
- **Path**: `/api/ingestion/transaction`
- **Content-Type**: `application/json`

---

## Request Payload Schema

```json
{
  "source": "notification",
  "amount": 450.00,
  "type": "expense",
  "merchant": "Zomato",
  "timestamp": "2026-10-11T20:15:00+05:30",
  "paymentMethod": "upi",
  "externalReference": "UPI-REF-10928374",
  "rawDescription": "Paid ₹450 to ZOMATO via Google Pay",
  "sourceApp": "com.google.android.apps.nbu.paisa.user",
  "sourceAccount": "HDFC Bank xx4589"
}
```

### Field Definitions

| Field | Type | Mandatory | Description |
|---|---|---|---|
| `source` | `"notification"` \| `"sms"` \| `"bank_api"` \| `"import"` | **Yes** | Origin of the transaction event. For Android notification listener, always `"notification"`. |
| `amount` | `number` | **Yes** | Transaction monetary value in standard currency units (e.g., `450.00`). Must be positive. |
| `type` | `"expense"` \| `"income"` | No | Transaction direction. Defaults to `"expense"` if debited/unspecified; `"income"` if credited/received. |
| `merchant` | `string` | No | Extracted merchant / counterparty name (e.g., `"Zomato"`, `"Uber"`). |
| `timestamp` | `string` (ISO-8601) | No | Notification receipt time (e.g., `"2026-10-11T20:15:00+05:30"`). Defaults to server time if omitted. |
| `paymentMethod` | `"upi"` \| `"credit_card"` \| `"debit_card"` \| `"wallet"` \| `"bank_transfer"` \| `"cash"` \| `"other"` | No | Detected payment rail. Defaults to `"upi"` for UPI payment apps. |
| `externalReference` | `string` | No | Extracted UTR, UPI transaction ID, or bank reference number used for **Level 1 exact deduplication**. |
| `rawDescription` | `string` | No | Full raw text extracted from notification title and body. Used for keyword fallback and merchant extraction. |
| `sourceApp` | `string` | No | Android package identifier of the app that posted the notification (see Supported Apps below). |
| `sourceAccount` | `string` | No | Last 4 digits or identifier of masked account (e.g., `"xx4589"`). |

---

## Supported Android Payment Package IDs

| Payment Provider | Android Package ID (`sourceApp`) | Default Payment Rail |
|---|---|---|
| Google Pay (Tez) | `com.google.android.apps.nbu.paisa.user` | `upi` |
| PhonePe | `com.phonepe.app` | `upi` |
| Paytm | `net.one97.paytm` | `upi` |
| CRED | `com.dreamplug.androidapp` | `credit_card` / `upi` |
| Amazon Pay | `in.amazon.mShop.android.shopping` | `upi` |
| BHIM UPI | `in.org.npci.upiapp` | `upi` |
| Default SMS Inbox | `com.google.android.apps.messaging` | `bank_transfer` / `debit_card` |

---

## Response Schemas

### 1. Created & Automatically Confirmed (201 Created)
Returned when categorization confidence is high (`>= 0.90`):

```json
{
  "status": "created",
  "reviewStatus": "confirmed",
  "transaction": {
    "id": "tx-ing-1728659123-abcde",
    "type": "expense",
    "amount": 450,
    "categoryId": "food",
    "merchant": "Zomato",
    "merchantNormalized": "zomato",
    "categoryConfidence": 0.98,
    "source": "notification",
    "paymentMethod": "upi",
    "externalReference": "UPI-REF-10928374",
    "timestamp": "2026-10-11T20:15:00.000Z",
    "fingerprint": "expense_45000_zomato_1920732_upi"
  },
  "categorization": {
    "categoryId": "food",
    "confidence": 0.98,
    "matchedRuleId": "rule-zomato",
    "reason": "Matched learned merchant rule for 'zomato'",
    "suggestedCategoryName": "Food"
  }
}
```

### 2. Queued for Review (200 OK)
Returned when categorization confidence is medium or low (`< 0.90`), pending user review in Review Inbox:

```json
{
  "status": "pending_review",
  "reviewStatus": "pending_review",
  "transaction": {
    "id": "tx-ing-1728659124-xyz12",
    "type": "expense",
    "amount": 780,
    "categoryId": "other",
    "merchant": "ABC TRADERS",
    "categoryConfidence": 0,
    "source": "notification",
    "paymentMethod": "upi"
  },
  "categorization": {
    "categoryId": null,
    "confidence": 0,
    "reason": "Unrecognized merchant and no keyword matches"
  }
}
```

### 3. Duplicate Detected (200 OK)
Returned when a matching `externalReference` or near-time transaction fingerprint already exists:

```json
{
  "status": "duplicate",
  "existingTransactionId": "tx-ing-1728659123-abcde",
  "duplicateReason": "Matched exact external reference 'UPI-REF-10928374'",
  "categorization": {
    "categoryId": "food",
    "confidence": 0.98
  },
  "reviewStatus": "confirmed"
}
```

---

## Error Responses

### Validation Error (400 Bad Request)
```json
{
  "error": {
    "code": "INVALID_INGESTION_PAYLOAD",
    "message": "Amount must be a valid positive number"
  }
}
```
