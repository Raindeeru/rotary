import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { listProjectsRequest, Project } from '../lib/api';

type HomePageProps = {
  backendStatus: { 'Connection Status'?: string } | null;
  backendError: string | null;
};

export function HomePage({ backendError }: HomePageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listProjectsRequest()
      .then((data) => { if (!cancelled) setProjects(data); })
      .catch((err: unknown) => {
        if (!cancelled)
          setProjectsError(err instanceof Error ? err.message : 'Unable to load projects.');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="main">
      {/* Hero */}
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">Rotary</h1>
          <p className="hero__subtitle">Short Statement</p>
          <div className="hero__actions">
            <button type="button" className="hero__primary-cta">View Projects</button>
            <Link to="/register" className="hero__secondary-cta" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Join Us
            </Link>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="section">
        <h2 className="section__title">Projects</h2>
        {backendError ? (
          <p style={{ color: '#b91c1c', fontSize: '0.88rem' }}>{backendError}</p>
        ) : (
          <div className="section__grid">
            {projectsError ? (
              <Card title="Projects unavailable" description={projectsError} status="Error" />
            ) : projects.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} title="Project Title" description="Short description" status="Status" />
              ))
            ) : (
              projects.map((project) => (
                <Card
                  key={project.id}
                  title={project.title}
                  description={project.description}
                  status={project.status}
                />
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}