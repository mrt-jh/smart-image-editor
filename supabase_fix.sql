-- 임시 공개 정책 추가 (개발/테스트용)
CREATE POLICY \
Allow
anonymous
access
to
teams\ ON teams
    FOR ALL USING (true);

CREATE POLICY \Allow
anonymous
access
to
projects\ ON projects
    FOR ALL USING (true);

CREATE POLICY \Allow
anonymous
access
to
banners\ ON banners
    FOR ALL USING (true);

CREATE POLICY \Allow
anonymous
access
to
banner_history\ ON banner_history
    FOR ALL USING (true);

CREATE POLICY \Allow
anonymous
access
to
banner_comments\ ON banner_comments
    FOR ALL USING (true);

-- Storage 정책도 공개로 설정
CREATE POLICY \Allow
public
access
to
banner-images\ ON storage.objects
    FOR ALL USING (bucket_id = 'banner-images');

CREATE POLICY \Allow
public
access
to
logos\ ON storage.objects
    FOR ALL USING (bucket_id = 'logos');

CREATE POLICY \Allow
public
access
to
thumbnails\ ON storage.objects
    FOR ALL USING (bucket_id = 'thumbnails');
