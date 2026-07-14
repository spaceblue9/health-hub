# PRD
## Project Name
Tacking Timeline Anything
## Project Type
Web App
## Platform Summary
Browser-based application that users open through a web browser on desktop or mobile devices.
## Goal
ผมมีปัญหาในการเล่ารายละเอียดให้คุณหมอฟังว่าคุณแม่ ประสบอุบัติเหตุเมื่่อไหร่ ที่ไหนอย่างไร มาหาหมอเมื่อไหร่ ได้ยาอะไรบ้าง มีแพ้ยาไหม เกิดเป็นโรคอะไรเมื่อไหร่ อายุเท่าไหร่ น้ำหนักเท่าไหร่ ส่วนสูงเท่าไหร่ ความดันเท่าไหร่ วัดวันไหน และการเก็บเอกสาร เช่นใบนัด ใบ X-ray และเอกสารต่างๆ
## Target Users
admin เป็นคน Appove คนขอใช้ระบบ และกำหนดสิทธิ ในการสร้าง User Profile ได้ , สิทธิ ในการแชร์เอกสาร, สิทธิในการออก Report , กำหนดได้ว่า  แต่ละ user สามารถสร้างได้กี่ profile

user สามารถ สร้าง profile ของคนในครอบครัวได้ ตามที่ admin กำหนด เช่น user1 สร้างได้ 3 profile คือ profile ของพ่อ, profile ของแม่ และ Profile ของตนเอง สามารถออกรายงานเป็น Timeline กำหนดช่วงวัน สามารถแชร์ให้คนอื่นที่ได้ link ดูได้โดยไม่ต้องมี password แต่มีการกำหนด Exprie link เช่นสร้าง link ให้ 10 นาที หรือ แชร์ 7 วัน
## Core Features
- 1. admin เป็นคน Appove คนขอใช้ระบบ
- 2. กำหนดสิทธิ ให้ User สามารถสร้าง User Profile ได้
- 3. แต่ละ User Profile จะประกอบด้วยรายละเอียดต่างๆ สามารถตอบปัญหาของเราได้
- 4. admin เป็นคน กำหนด สิทธิ ในการแชร์เอกสาร
- 5. admin เป็นคน กำหนด สิทธิในการออก Report
- 6. admin กำหนดได้ว่า  แต่ละ user สามารถสร้างได้กี่ profile
- 7. user สามารถ สร้าง profile ของคนในครอบครัวได้ ตามที่ admin กำหนด เช่น user1 สร้างได้ 3 profile คือ profile ของพ่อ, profile ของแม่ และ Profile ของตนเอง
- 8.  user สามารถออกรายงานเป็น Timeline กำหนดช่วงวัน
- 9. สามารถแชร์ให้คนอื่นที่ได้ link ดูได้โดยไม่ต้องมี password แต่มีการกำหนด Exprie link เช่นสร้าง link ให้ 10 นาที หรือ แชร์ 7 วัน
- 10. user สามารถ Attack File แต่ละครั้งใน Timeline ได้
- 11. user สามารถแนบไฟล์เอกสารส่วนตัว (Common Documents) เช่น ประวัติการแพ้ยา หรือบัตรผู้ป่วย เข้ากับ Profile ของคนไข้ได้โดยตรง
- 12. user สามารถคลิกที่รูป Profile เพื่อดูภาพขยายใหญ่ (Full-screen Image Modal) ได้
## User Flow
user ทำการสมัครเข้าใช้งาน admin จะต้องทำการ Approve ก่อนที่จะสามารถ login เข้าระบบได้ admin จะเป็นคนกำหนดสิทธิการเข้าใช้งาน admin เป็นคน Appove คนขอใช้ระบบ และกำหนดสิทธิ ในการสร้าง User Profile ได้ , สิทธิ ในการแชร์เอกสาร, สิทธิในการออก Report , กำหนดได้ว่า  แต่ละ user สามารถสร้างได้กี่ profile และ user สามารถ สร้าง profile ของคนในครอบครัวได้ ตามที่ admin กำหนด เช่น user1 สร้างได้ 3 profile คือ profile ของพ่อ, profile ของแม่ และ Profile ของตนเอง สามารถออกรายงานเป็น Timeline กำหนดช่วงวัน สามารถแชร์ให้คนอื่นที่ได้ link ดูได้โดยไม่ต้องมี password แต่มีการกำหนด Exprie link เช่นสร้าง link ให้ 10 นาที หรือ แชร์ 7 วัน
## Success Criteria
admin เป็นคน Appove คนขอใช้ระบบ และกำหนดสิทธิ ในการสร้าง User Profile ได้ , สิทธิ ในการแชร์เอกสาร, สิทธิในการออก Report , กำหนดได้ว่า  แต่ละ user สามารถสร้างได้กี่ profile

user สามารถ สร้าง profile ของคนในครอบครัวได้ ตามที่ admin กำหนด เช่น user1 สร้างได้ 3 profile คือ profile ของพ่อ, profile ของแม่ และ Profile ของตนเอง สามารถออกรายงานเป็น Timeline กำหนดช่วงวัน สามารถแชร์ให้คนอื่นที่ได้ link ดูได้โดยไม่ต้องมี password แต่มีการกำหนด Exprie link เช่นสร้าง link ให้ 10 นาที หรือ แชร์ 7 วัน
## Constraints
พยายามให้ใช้ html, css, javascript และ Database ให้ใช้ Google sheet แต่ถ้าติดข้อจำกัด ไม่สามารถพัฒนาโปรแกรมตาม Requirement ได้ให้เปลี่ยน เทคโนโลยีได้ เช่นมาใช้ nodejs supabase react หรืออื่น แต่ยังพยายาม ใช้ Free host เช่น Vercel, Netlify, github เป็นต้น