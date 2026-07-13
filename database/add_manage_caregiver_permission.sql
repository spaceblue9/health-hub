-- เพิ่มคอลัมน์ can_manage_caregivers ในตาราง profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_manage_caregivers BOOLEAN DEFAULT false;

-- สั่งให้ Supabase อัปเดต Cache เพื่อให้ระบบ API มองเห็นคอลัมน์ใหม่ทันที
NOTIFY pgrst, 'reload schema';
