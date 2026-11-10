# บทบาทและสิทธิ์ผู้ใช้

หลังจากรัน `schema.sql` แล้ว ให้รัน `role_access.sql` ใน Supabase SQL Editor เพื่อเปิดใช้สิทธิ์ตามบทบาท:

- `super_admin`: อ่าน/จัดการครุภัณฑ์ทั้งหมด และกำหนดบทบาทผู้ใช้งาน
- `asset_manager`: อ่านและเพิ่มครุภัณฑ์ได้ แต่แก้ไข/ลบไม่ได้
- `viewer`: ดูข้อมูลได้อย่างเดียว

บัญชี `aphisit.s@ckr.ac.th` จะได้รับบทบาท `super_admin` เมื่อบัญชีมีอยู่แล้ว หรือเมื่อถูกสร้างใน Supabase Authentication หลัง migration นี้ การสร้างบัญชีและตั้ง/เปลี่ยนรหัสผ่านให้ทำผ่าน Supabase Dashboard → Authentication → Users เท่านั้น อย่าใส่รหัสผ่านหรือ `service_role` key ในซอร์สโค้ด, GitHub หรือ Cloudflare build variables

Super Admin ใช้เมนู **กำหนดสิทธิ์ผู้ใช้** ในระบบเพื่อเปลี่ยนบทบาทบัญชีที่สร้างแล้ว ผู้ใช้ใหม่ให้สร้าง/เชิญใน Supabase Dashboard ก่อน จากนั้นกลับมาเลือกบทบาทในเมนูนี้ ระบบห้ามลดสิทธิ์บัญชี Super Admin คนสุดท้าย

