"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { Project } from "@/types";
import { useAuth } from "./authContext";
import { api } from "./api";

interface ProjectContextType {
  activeProject: Project | null;
  availableProjects: Project[];
  setActiveProjectById: (id: string) => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      if (!user) {
        setAvailableProjects([]);
        setActiveProjectId(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const projects = await api.get<Project[]>("/projects");
        setAvailableProjects(projects);
        
        // Default to first project if none active or current active not in list
        if (!activeProjectId || !projects.find(p => p.id === activeProjectId)) {
          setActiveProjectId(projects[0]?.id || null);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [user]);

  const activeProject = useMemo(() => 
    availableProjects.find(p => p.id === activeProjectId) || null
  , [availableProjects, activeProjectId]);

  const setActiveProjectById = (id: string) => {
    setActiveProjectId(id);
  };

  return (
    <ProjectContext.Provider value={{ activeProject, availableProjects, setActiveProjectById, isLoading }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
