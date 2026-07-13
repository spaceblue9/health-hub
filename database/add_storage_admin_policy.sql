-- 1. สร้าง Policy ให้ Admin สามารถจัดการไฟล์ทั้งหมดใน Storage ได้
-- เพื่อให้ระบบสามารถลบไฟล์ขยะของผู้ใช้คนอื่นได้เวลาแอดมินกดลบผู้ใช้



-- ลบ Policy เดิมถ้ามี (เผื่อรันซ้ำ)
DROP POLICY IF EXISTS "Admins can manage all storage objects" ON storage.objects;

-- สร้าง Policy ใหม่
CREATE POLICY "Admins can manage all storage objects"
ON storage.objects
FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
