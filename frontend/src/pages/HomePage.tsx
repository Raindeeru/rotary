import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { listProjectsRequest } from '../lib/api';
import type { Project } from '../lib/api';

type HomePageProps = {
  backendStatus: { 'Connection Status'?: string } | null;
  backendError: string | null;
};

type PublicMember = {
  name: string;
  vocation: string;
};

export function HomePage({ backendError }: HomePageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    fetch('https://rotary-backend-wixk.onrender.com/members/public')
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setMembers(data); })
      .catch((err: unknown) => {
        if (!cancelled)
          setMembersError(err instanceof Error ? err.message : 'Unable to load member directory.');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="main">
      {/* Hero */}
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">Rotary Club of San Fernando, Pampanga</h1>
          <p className="hero__subtitle">We strive to improve the quality of life in Pampanga through accountability, partnership, and sustainable impact.</p>
          <div className="hero__actions">
            <Link to="/about" className="hero__secondary-cta" style={{ textDecoration: 'none', display: 'inline-block' }}>
              About Us
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

      {/* Members Directory - FR-19: Public access to basic directory */}
      <section className="section">
        <h2 className="section__title">Our Members</h2>
        {membersError ? (
          <p style={{ color: '#b91c1c', fontSize: '0.88rem' }}>{membersError}</p>
        ) : members.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>Member directory is currently unavailable.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {members.map((member, index) => (
              <div key={index} style={{
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                background: '#fff'
              }}>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600', color: '#111' }}>
                  {member.name}
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#6b7280' }}>
                  {member.vocation || 'Member'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}