import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { bannerConfigs } from '../config/bannerConfigs';
import { BannerWork, BannerConfig, BannerType, DeviceType, Project } from '../types';

interface BannerSelection {
  bannerType: BannerType;
  deviceType: DeviceType;
  config: BannerConfig;
}

interface BannerSelectorProps {
  onSelect: (selection: BannerSelection) => void;
  onProjectSelect: (project: Project) => void;
  onProjectCreate: (name: string) => void;
  completedWorks?: BannerWork[]; // deprecated, not used
  onDownload: (work: BannerWork) => void;
  onEdit: (work: BannerWork) => void;
  projects?: Project[];
}

const BannerSelector: React.FC<BannerSelectorProps> = ({ onSelect, onProjectSelect, onProjectCreate, onDownload, onEdit, projects = [] }) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [projectInput, setProjectInput] = useState('');
  
  const handleSelect = () => {
    if (!selectedOption) return;
    
    const config = bannerConfigs[selectedOption];
    const [bannerTypeString, deviceTypeString] = selectedOption.split('-');
    
    const bannerType = bannerTypeString as BannerType;
    const deviceType = (deviceTypeString === 'mobile' ? 'mobile' : 'pc') as DeviceType;

    onSelect({
      bannerType,
      deviceType,
      config
    });
  };

  return (
    <div className="space-y-8">
      {/* 프로젝트 선택/생성 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">담당사업팀/담당자 선택</h2>
        <div className="flex gap-2 mb-4">
          <select
            className="border rounded px-3 py-2"
            onChange={e => {
              const project = projects.find(p => p.id === e.target.value);
              if (project) onProjectSelect(project);
            }}
            defaultValue=""
          >
            <option value="">프로젝트(팀/담당자) 선택</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <input
            type="text"
            className="border rounded px-3 py-2"
            placeholder="새 프로젝트명 (팀/담당자)"
            value={projectInput}
            onChange={e => setProjectInput(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => {
              if (projectInput.trim()) {
                onProjectCreate(projectInput.trim());
                setProjectInput('');
              }
            }}
          >
            새로 만들기
          </button>
        </div>
      </div>
      {/* 완성된 작업 리스트 */}
      {projects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">완성된 배너 목록</h2>
          <div className="divide-y">
            {projects.map((project) => (
              <div key={project.id} className="mb-4">
                <div className="font-bold text-blue-700 mb-2">{project.name}</div>
                {project.banners.length === 0 && (
                  <div className="text-xs text-gray-400 mb-2">아직 등록된 배너가 없습니다.</div>
                )}
                {project.banners.map((work) => (
                  <div
                    key={work.id}
                    className="py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded px-2"
                    onClick={() => onEdit(work)}
                  >
                    <div>
                      <div className="font-medium">{work.title}</div>
                      <div className="text-xs text-gray-500">{work.createdAt instanceof Date ? work.createdAt.toLocaleString() : new Date(work.createdAt).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onDownload(work); }}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      JPG 다운로드
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 배너 선택 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">배너 타입 선택</h2>
        
        <div className="space-y-4">
          <div className="relative">
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">배너 타입을 선택하세요</option>
              {Object.entries(bannerConfigs).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          
          {selectedOption && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">선택된 배너 규격</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>크기: {bannerConfigs[selectedOption].width} × {bannerConfigs[selectedOption].height}</p>
                <p>텍스트: {bannerConfigs[selectedOption].fixedText ? '고정 위치' : '자유 편집'}</p>
              </div>
            </div>
          )}
          
          <button
            onClick={handleSelect}
            disabled={!selectedOption}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            선택하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannerSelector; 