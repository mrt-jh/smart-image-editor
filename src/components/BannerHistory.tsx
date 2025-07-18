import React, { useState, useEffect } from 'react';
import { Banner } from '../types';
import { useSupabase } from '../hooks/useSupabase';

interface BannerHistoryProps {
  onBannerEdit: (banner: Banner) => void;
  onBack: () => void;
  onGoHome?: () => void;
}

export const BannerHistory: React.FC<BannerHistoryProps> = ({ onBannerEdit, onBack, onGoHome }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { getAllBanners, deleteBanner } = useSupabase();

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const allBanners = await getAllBanners();
      setBanners(allBanners);
    } catch (error) {
      console.error('배너 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('정말로 이 배너를 삭제하시겠습니까?')) return;
    
    try {
      await deleteBanner(bannerId);
      setBanners(prev => prev.filter(banner => banner.id !== bannerId));
    } catch (error) {
      console.error('배너 삭제 실패:', error);
      alert('배너 삭제에 실패했습니다.');
    }
  };

  const filteredBanners = banners.filter(banner =>
    banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banner.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banner.banner_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banner.device_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'draft': return '임시저장';
      case 'review': return '검토중';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={onGoHome}
                title="홈으로 이동"
              >
                Smart Banner Editor
              </h1>
              <p className="mt-2 text-gray-600">
                생성된 모든 배너를 확인하고 관리하세요
              </p>
            </div>
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>홈으로</span>
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="배너 제목, 설명, 타입으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            총 {filteredBanners.length}개의 배너
          </p>
        </div>

        {/* 배너 목록 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '생성된 배너가 없습니다'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? '다른 검색어를 시도해보세요' : '새 배너를 만들어보세요'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      미리보기
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      배너 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      타입
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBanners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-gray-50">
                      {/* 미리보기 */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          {banner.thumbnail_url || banner.final_banner_url || banner.background_image_url ? (
                            <img
                              src={banner.thumbnail_url || banner.final_banner_url || banner.background_image_url}
                              alt={banner.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 배너 정보 */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {banner.title}
                        </div>
                        {banner.description && (
                          <div className="text-sm text-gray-500 line-clamp-2 max-w-md">
                            {banner.description}
                          </div>
                        )}
                      </td>

                      {/* 타입 */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {banner.banner_type}
                          </span>
                          <br />
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {banner.device_type}
                          </span>
                        </div>
                      </td>

                      {/* 상태 */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(banner.status)}`}>
                          {getStatusText(banner.status)}
                        </span>
                      </td>

                      {/* 생성일 */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {new Date(banner.created_at).toLocaleDateString('ko-KR')}
                        </div>
                        {banner.updated_at !== banner.created_at && (
                          <div className="text-xs text-gray-400">
                            수정: {new Date(banner.updated_at).toLocaleDateString('ko-KR')}
                          </div>
                        )}
                      </td>

                      {/* 작업 버튼 */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => onBannerEdit(banner)}
                            className="bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDelete(banner.id)}
                            className="bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 