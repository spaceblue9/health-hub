-- แก้ไขตาราง share_links ให้เพิ่ม ON DELETE CASCADE 
-- เพื่อให้เวลาลบผู้ใช้ ระบบสามารถลบลิงก์แชร์ที่ผู้ใช้นั้นเคยสร้างไว้ได้อัตโนมัติ

ALTER TABLE public.share_links 
DROP CONSTRAINT IF EXISTS share_links_created_by_fkey;

ALTER TABLE public.share_links 
ADD CONSTRAINT share_links_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
