# Tasks
## Backlog
### T-001 Kick Off The Project Context
- Status: `[x]` Done
- Detail:
  - [x] Review generated documents.
  - [x] Confirm missing assumptions with the product owner.
  - [x] **Confirmation Task:** Confirm if we should use Supabase instead of Google Sheets. (Supabase is better suited for magic-link auth, file attachments, and time-limited share links). -> *Agreed to use Supabase.*
  - [x] **Confirmation Task:** Confirm if we can use a framework like Vite + React or Next.js to speed up development instead of plain HTML/CSS/JS. -> *Agreed to use Vite + React.*
### T-002 Implement The Core Feature Set
- Status: `[x]` Done
- Detail:
  - [x] 1. admin เป็นคน Appove คนขอใช้ระบบ
  - [x] 2. กำหนดสิทธิ ให้ User สามารถสร้าง User Profile ได้
  - [x] 3. แต่ละ User Profile จะประกอบด้วยรายละเอียดต่างๆ สามารถตอบปัญหาของเราได้
  - [x] 4. admin เป็นคน กำหนด สิทธิ ในการแชร์เอกสาร
  - [x] 5. admin เป็นคน กำหนด สิทธิในการออก Report
  - [x] 6. admin กำหนดได้ว่า แต่ละ user สามารถสร้างได้กี่ profile
  - [x] 7. user สามารถ สร้าง profile ของคนในครอบครัวได้ ตามที่ admin กำหนด เช่น user1 สร้างได้ 3 profile คือ profile ของพ่อ, profile ของแม่ และ Profile ของตนเอง
  - [x] 8. user สามารถออกรายงานเป็น Timeline กำหนดช่วงวัน
  - [x] 9. สามารถแชร์ให้คนอื่นที่ได้ link ดูได้โดยไม่ต้องมี password แต่มีการกำหนด Exprie link เช่นสร้าง link ให้ 10 นาที หรือ แชร์ 7 วัน
  - [x] 10. user สามารถ Attack File แต่ละครั้งใน Timeline ได้
### T-003 Validate Success Criteria
- Status: `[x]` Done
- Detail:
  - [x] Check that the implementation satisfies: admin เป็นคน Appove คนขอใช้ระบบ และกำหนดสิทธิ ในการสร้าง User Profile ได้ , สิทธิ ในการแชร์เอกสาร, สิทธิในการออก Report , กำหนดได้ว่า  แต่ละ user สามารถสร้างได้กี่ profile
  - [x] user สามารถ สร้าง profile ของคนในครอบครัวได้ ตามที่ admin กำหนด เช่น user1 สร้างได้ 3 profile คือ profile ของพ่อ, profile ของแม่ และ Profile ของตนเอง สามารถออกรายงานเป็น Timeline กำหนดช่วงวัน สามารถแชร์ให้คนอื่นที่ได้ link ดูได้โดยไม่ต้องมี password แต่มีการกำหนด Exprie link เช่นสร้าง link ให้ 10 นาที หรือ แชร์ 7 วัน

### T-004 Patient Attachments and UI Enhancements
- Status: `[x]` Done
- Detail:
  - [x] Create SQL migration script to add `patient_id` to `attachments` table.
  - [x] Modify `attachments` schema to allow attachments without `event_id` if they belong to a profile.
  - [x] Add "Common Documents" upload section in `src/pages/Patient.jsx`.
  - [x] Implement Image Modal to view profile pictures in full size.