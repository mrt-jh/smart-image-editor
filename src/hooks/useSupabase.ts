import { useState, useEffect } from 'react';
import { Team, Project, Banner, TeamFormData, ProjectFormData } from '../types';
import { 
  mockTeamService, 
  mockProjectService, 
  mockBannerService, 
  mockStorageService,
  mockDashboardService 
} from '../services/mockService';

export const useSupabase = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // �ʱ� ������ �ε�
  const initializeData = async () => {
    try {
      setLoading(true);
      const [teamsData, projectsData, bannersData] = await Promise.all([
        mockTeamService.getTeams(),
        mockProjectService.getProjects(),
        mockBannerService.getBanners()
      ]);
      
      setTeams(teamsData);
      setProjects(projectsData);
      setBanners(bannersData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '������ �ε� �� ������ �߻��߽��ϴ�.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  // Team ���� �Լ���
  const createTeam = async (teamData: TeamFormData): Promise<Team> => {
    try {
      setLoading(true);
      const newTeam = await mockTeamService.createTeam(teamData);
      setTeams(prev => [...prev, newTeam]);
      setError(null);
      return newTeam;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '�� ���� �� ������ �߻��߽��ϴ�.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    teams,
    projects,
    banners,
    loading,
    error,
    initializeData,
    createTeam
  };
};
