# Memory
## Project Snapshot
Tacking Timeline Anything is a web-app focused on ผมมีปัญหาในการเล่ารายละเอียดให้คุณหมอฟังว่าคุณแม่ ประสบอุบัติเหตุเมื่่อไหร่ ที่ไหนอย่างไร มาหาหมอเมื่อไหร่ ได้ยาอะไรบ้าง มีแพ้ยาไหม เกิดเป็นโรคอะไรเมื่อไหร่ อายุเท่าไหร่ น้ำหนักเท่าไหร่ ส่วนสูงเท่าไหร่ ความดันเท่าไหร่ วัดวันไหน และการเก็บเอกสาร เช่นใบนัด ใบ X-ray และเอกสารต่างๆ
## Decisions
- Primary audience: admin เป็นคน Appove คนขอใช้ระบบ และกำหนดสิทธิ ในการสร้าง User Profile ได้ , สิทธิ ในการแชร์เอกสาร, สิทธิในการออก Report , กำหนดได้ว่า  แต่ละ user สามารถสร้างได้กี่ profile

user สามารถ สร้าง profile ของคนในครอบครัวได้ ตามที่ admin กำหนด เช่น user1 สร้างได้ 3 profile คือ profile ของพ่อ, profile ของแม่ และ Profile ของตนเอง สามารถออกรายงานเป็น Timeline กำหนดช่วงวัน สามารถแชร์ให้คนอื่นที่ได้ link ดูได้โดยไม่ต้องมี password แต่มีการกำหนด Exprie link เช่นสร้าง link ให้ 10 นาที หรือ แชร์ 7 วัน
- Prompt pack level: standard
- Responsive mode: fully-responsive
## Constraints
- **Frontend**: React (Vite) + Tailwind CSS (Replaced HTML/CSS/JS due to complex state and routing requirements).
- **Backend/DB**: Supabase (Replaced Google Sheets due to file attachments, magic-link auth, and expiring links requirements).
- **Hosting**: Free tier hosts (Vercel, Netlify, GitHub Pages).