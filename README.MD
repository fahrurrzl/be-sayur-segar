# 🥬 SayurSegar Backend

Backend service untuk aplikasi **SayurSegar** — platform e-commerce sayur dan buah segar langsung dari petani.  
Dibangun dengan **Express.js + TypeScript**, menggunakan **Prisma ORM** untuk manajemen database.

---

## 🚀 Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Language:** TypeScript
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Templating:** EJS (untuk view sederhana, misalnya email)

---

## 📂 Project Structure

```base
be-sayur-segar/
│
├── .idea/ # Konfigurasi IDE (optional)
├── prisma/ # Skema database & migrasi Prisma
├── src/ # Kode sumber utama backend
│ ├── controllers/ # Controller untuk handle request
│ ├── middlewares/ # Middleware (auth, error handling, dsb.)
│ ├── routes/ # Routing API
│ ├── schema/ # Validasi request (Zod/Joi)
│ ├── types/ # TypeScript types/interfaces
│ ├── utils/ # Utility/helper functions
│ └── index.ts # Entry point Express app
│
├── .env.example # Contoh environment variables
├── .gitignore # Ignore file/folder dari Git
├── package.json # Dependensi & script npm
├── package-lock.json # Versi eksak dependensi
└── vercel.json # Konfigurasi deployment Vercel
```

## 🛠️ Getting Started

### 1. Clone Repository

```bash
  git clone https://github.com/fahrurrzl/be-sayur-segar.git
  cd be-sayur-segar
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file .env berdasarkan .env.example

```bash
cp .env.example .env
```

Isi variabel sesuai dengan konfigurasi Supabase kamu:

```env
DATABASE_URL="postgresql://username:password@db.supabase.co:5432/postgres"
DIRECT_URL="postgresql://username:password@db.supabase.co:5432/postgres"
```

📌 **DATABASE_URL** dan **DIRECT_URL\*** bisa didapatkan dari Supabase Dashboard → Project → Settings → Database.

### 4. Prisma Setup

Generate Prisma Client

```bash
npx prisma generate
```

Jalankan migrasi database ke Supabase

```bash
npx prisma migrate dev
```

### 5. Run Development Server

```bash
npm run dev
```

Server akan berjalan di: http://localhost:5000
(atau port yang ditentukan di .env)
