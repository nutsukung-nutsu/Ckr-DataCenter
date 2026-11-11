# BCN CKR IT Assets

ระบบทะเบียนและติดตามครุภัณฑ์งานเทคโนโลยีสารสนเทศ วิทยาลัยพยาบาลบรมราชชนนี จักรีรัช

## ฟังก์ชันใน starter

- หน้าลงชื่อเข้าใช้ด้วย Supabase Auth และลืมรหัสผ่าน
- Dashboard สรุปจำนวนครุภัณฑ์ ความพร้อมใช้งาน งานซ่อม มูลค่าจัดซื้อ และสัดส่วนหมวดหมู่
- ค้นหา/กรองทะเบียน เพิ่มและลบรายการ ส่งออกรายงาน CSV
- คลังวัสดุ: นำเข้าจาก CSV จัดหมวดหมู่ กำหนดจำนวนขั้นต่ำ บันทึกรับเข้า/เบิกจ่าย และดูรายการใกล้หมด
- ตัวอย่างข้อมูลสำหรับ preview เมื่อยังไม่ได้ตั้งค่า Supabase
- เตรียม GitHub Actions สำหรับ build และ deploy ไป Cloudflare Pages
- ฟอนต์หลัก TH Sarabun (Sarabun) ขนาดฐาน 16px พร้อม Prompt สำหรับหัวเรื่องและตัวเลข

## เริ่มใช้งาน

1. ติดตั้ง Node.js 20 ขึ้นไป
2. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ Supabase Project URL และ publishable/anon key
3. ใน Supabase SQL Editor ให้รัน `supabase/schema.sql` แล้วรัน `supabase/role_access.sql` เพื่อเปิดสิทธิ์ตามบทบาท
4. สำหรับคลังวัสดุ ให้รัน migration `supabase/migrations/202611110001_materials_inventory.sql` เพิ่มเติมใน Supabase SQL Editor
5. สร้างบัญชีบุคลากรใน Supabase Dashboard → Authentication → Users (อย่าใส่รหัสผ่านในโค้ดหรือ GitHub)
6. Super Admin กำหนดบทบาทได้ในเมนู **กำหนดสิทธิ์ผู้ใช้**
7. ติดตั้งและเปิดเว็บ: `npm install`, `npm run dev`
8. สร้างไฟล์สำหรับเผยแพร่: `npm run build` (ผลลัพธ์อยู่ใน `dist/`)

ห้ามนำ `service_role` key มาใส่ในเว็บ ให้ใช้ publishable/anon key พร้อมเปิด RLS เท่านั้น ข้อมูลเดโมจะแสดงจนกว่าจะกำหนด URL และ key ถูกต้อง

## GitHub และ Cloudflare Pages

นำโฟลเดอร์นี้เข้า Git repository แล้วตั้งค่า repository variables/secrets ต่อไปนี้เพื่อใช้ workflow ใน `.github/workflows/deploy.yml`:

**GitHub Variables**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (เป็น key สำหรับ client; RLS ต้องเปิด)
- `CLOUDFLARE_PAGES_PROJECT`

**GitHub Secrets**

- `CLOUDFLARE_API_TOKEN` (สิทธิ์ deploy Cloudflare Pages)
- `CLOUDFLARE_ACCOUNT_ID`

เมื่อ push ไป `main` workflow จะ build แล้ว deploy ไป Cloudflare Pages ให้ สร้าง Pages project ชื่อเดียวกับ `CLOUDFLARE_PAGES_PROJECT` และกำหนด `main` เป็น production branch ก่อน

## บทบาทและสิทธิ์

อ่าน [คู่มือบทบาทผู้ใช้](supabase/ROLES.md) ก่อนใช้งานจริง บทบาทและนโยบายฐานข้อมูลกำหนดไว้ใน `supabase/role_access.sql`; หากยังไม่รัน migration ระบบจะไม่เปิด session ให้บัญชีที่ยังไม่มีบทบาท
