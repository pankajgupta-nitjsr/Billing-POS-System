# A2Z Mart — Professional SaaS Retail POS, Billing & Inventory Platform

> **Smart Retail POS, Smart Negotiation, Indian GST Billing & Inventory Management System**

A production-ready retail management and POS web application engineered for Indian retail businesses combining:
1. **Kirana / Grocery / FMCG** (Decimal weights: kg, gm, litre, ml; zero/exempt GST slabs, loose goods)
2. **Fashion / Garments** (Variant matrix: Size, Color; Floor price protection; HSN 6109/6203)
3. **General Retail Products** (Barcode scanning, continuous camera mode, USB/HID external scanner support)

---

## 🚀 Key Highlights & Architectural Features

### 1. Ultra-Fast POS Billing Terminal
- **Keyboard-driven workflow**:
  - `F2`: Instant search input focus
  - `F4`: Smartphone camera barcode scanner
  - `F8`: Hold active bill
  - `F9`: Collect payment & checkout
  - `Esc`: Close open modals
- **Decimal Quantity Support**: Correct fractional calculations (e.g., `1.75 kg × ₹95/kg = ₹166.25`).
- **Fashion Variants Matrix**: Support for garments with varying Sizes (S, M, L, XL), Colors, and individual barcodes.
- **Held Bills Management**: Suspend customer carts and resume instantly.

### 2. Smart Bargain & Negotiation Engine
- **Item-Level Negotiation**:
  - Compares Customer Offer against Absolute Floor.
  - Generates recommended counter-offers using margin-buffer calculations.
  - Enforces strict loss prevention: Proposed prices below the absolute floor are **BLOCKED**.
  - Cashier override security: Requires Owner PIN (`1234`) to authorize overrides.
  - Price override applies strictly to the current transaction without altering master catalog prices.
- **Cart-Level Negotiation**:
  - Evaluates whole-cart offers (e.g., "₹1200 final kar do" on a ₹1347 cart).
  - Distributes approved discounts proportionally across line items while protecting each item's individual floor.

### 3. Dual Barcode & QR Scanning
- **Smartphone Camera Scanner**:
  - Powered by `html5-qrcode`.
  - Continuous scanning mode with audio tone feedback.
  - Supports QR, Code 128, EAN-13, EAN-8, and UPC formats.
- **Plug-and-Play USB/Bluetooth HID Scanner**:
  - Detects rapid keystroke intervals (<50ms).
  - Automatically queries the product database and returns focus to billing.

### 4. Billing, Payments & Receipt Studio
- **Multi-Mode Payments**: Cash, UPI QR, Card, and Split payments.
- **Dynamic UPI QR Code**: Dynamically generates NPCI standard UPI QR codes with exact transaction amounts.
- **Exact Change Calculator**: Instant change calculation (e.g., Paid ₹500 for a ₹325 bill &rarr; Change ₹175).
- **Receipt & Invoice Printing**:
  - 80mm thermal receipt format.
  - A4 tax invoice print preview.
  - Web Share API integration.

### 5. Inventory & Multi-Tenancy Engine
- **Stock Movement Ledger**: Audit trail tracking `OPENING`, `PURCHASE`, `SALE`, `RETURN`, `DAMAGE`, and `ADJUSTMENT`.
- **Valuation Analytics**: Cost price valuation vs. retail potential value.
- **Sales Return Workflow**: Full or partial quantity return with automatic stock restoration and refund recording.
- **Inward Purchases & Suppliers**: Track vendor credit balances, purchase orders, and stock incrementing.
- **Operating Expenses**: Track rent, electricity, salaries, and freight to calculate Net Profit.
- **Barcode & QR Label Studio**: Printable sheets for 80mm roll printers and 3-column A4 label sheets.
- **Bulk CSV Import**: Pre-validation catches duplicate SKUs, missing barcodes, and floor inconsistencies before importing.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Icons**: Lucide React
- **Charts & Visualizations**: Recharts
- **Barcode & QR**: `html5-qrcode`, `jsbarcode`, `qrcode`
- **Backend**: Cloud Firestore, Firebase Authentication, Firebase Storage
- **Testing**: Vitest unit & integration test suites

---

## 📦 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/pankajgupta-nitjsr/Billing-POS-System.git
cd Billing-POS-System

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be live at `http://localhost:5173`.

### Running Tests

```bash
npm test
```

### Production Build

```bash
npm run build
```

---

## 🔐 Credentials & Demo Defaults

- **Store**: A2Z Mart
- **Owner Account**: Rajesh Sharma (`owner@a2zmart.in`)
- **Cashier Account**: Amit Kumar (`cashier@a2zmart.in`)
- **Owner Override PIN**: `1234`
- **Critical Acceptance Test Barcode**: `TSH001` (Men's T-Shirt)
