-- Supabase 데이터베이스 스키마 수정
-- logo_urls 컬럼 추가 및 기타 필드 정리

-- 1. banners 테이블에 누락된 컬럼들 추가
ALTER TABLE banners 
ADD COLUMN IF NOT EXISTS logo_urls TEXT[],
ADD COLUMN IF NOT EXISTS final_banner_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 2. banner_history 테이블에도 동일한 컬럼들 추가
ALTER TABLE banner_history 
ADD COLUMN IF NOT EXISTS logo_urls TEXT[],
ADD COLUMN IF NOT EXISTS final_banner_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 3. Storage 버킷 확인 및 생성
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('banner-images', 'banner-images', true),
    ('final-banners', 'final-banners', true),
    ('logos', 'logos', true),
    ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS 정책 확인 (인증 없이 접근 가능하도록)
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;

-- 5. Storage 정책 확인
CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Public Upload" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Public Update" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Public Delete" ON storage.objects FOR DELETE USING (true);

-- 6. 히스토리 함수 업데이트 (logo_urls 포함)
CREATE OR REPLACE FUNCTION create_banner_history()
RETURNS TRIGGER AS $$
BEGIN
    -- 업데이트 시에만 히스토리 생성
    IF TG_OP = 'UPDATE' AND (
        OLD.title != NEW.title OR 
        OLD.background_image_url != NEW.background_image_url OR 
        OLD.final_banner_url != NEW.final_banner_url OR
        OLD.logo_url != NEW.logo_url OR 
        OLD.logo_urls != NEW.logo_urls OR
        OLD.text_elements != NEW.text_elements
    ) THEN
        INSERT INTO banner_history (
            banner_id, version, title, background_image_url, final_banner_url, 
            logo_url, logo_urls, text_elements, notes
        ) VALUES (
            OLD.id, OLD.version, OLD.title, OLD.background_image_url, OLD.final_banner_url,
            OLD.logo_url, OLD.logo_urls, OLD.text_elements, 
            'Auto-saved version ' || OLD.version
        );
        
        -- 새 버전 번호 증가
        NEW.version = OLD.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 기본 팀과 프로젝트 생성 (없는 경우)
INSERT INTO teams (id, name, description, color) 
VALUES 
    ('00000000-0000-0000-0000-000000000001', '기본 팀', '기본 팀입니다.', '#3B82F6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, description, team_id) 
VALUES 
    ('00000000-0000-0000-0000-000000000001', '기본 프로젝트', '기본 프로젝트입니다.', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Remove banner_type check constraint from banners table
-- This allows any value to be inserted into banner_type column

-- Drop the existing check constraint
ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_banner_type_check;

-- The banner_type column will now accept any VARCHAR(50) value
-- without the restriction to specific values

-- 완료 메시지
SELECT 'Database schema updated successfully!' as status;
