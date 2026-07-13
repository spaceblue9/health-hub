# Architecture
## Project Type
Web App
## Platform Guidance
- Start with responsive web screens before considering native mobile or desktop wrappers.
- Prioritize clear routes, form states, loading states, and browser-friendly deployment.
## Preferred Stack
Frontend: React (via Vite), Tailwind CSS for styling (allows fast, responsive UI design).
Backend / Database: Supabase (PostgreSQL for relations, Auth for magic-link, Storage for file attachments).
Hosting: Vercel or Netlify (Free tier).
## Authentication
Enabled via magic-link
## Roles
- admin เป็นคน Appove คนขอใช้ระบบ และกำหนดสิทธิ ในการสร้าง User Profile ได้ , สิทธิ ในการแชร์เอกสาร, สิทธิในการออก Report , กำหนดได้ว่า  แต่ละ user สามารถสร้างได้กี่ profile
- user สามารถ สร้าง profile ของคนในครอบครัวได้ ตามที่ admin กำหนด เช่น user1 สร้างได้ 3 profile คือ profile ของพ่อ, profile ของแม่ และ Profile ของตนเอง สามารถออกรายงานเป็น Timeline กำหนดช่วงวัน สามารถแชร์ให้คนอื่นที่ได้ link ดูได้โดยไม่ต้องมี password แต่มีการกำหนด Exprie link เช่นสร้าง link ให้ 10 นาที หรือ แชร์ 7 วัน
## Database
Supabase (PostgreSQL + Storage)
## External Integrations
- Supabase