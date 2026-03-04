import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { listProjectsRequest, Project } from '../lib/api';

type BackendStatus = {
  'Connection Status'?: string;
};

type HomePageProps = {
  backendStatus: BackendStatus | null;
  backendError: string | null;
};

export function HomePage({ backendStatus, backendError }: HomePageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listProjectsRequest()
      .then((data) => {
        if (!cancelled) {
          setProjects(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setProjectsError(
            err instanceof Error
              ? err.message
              : 'Unable to load projects right now.',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const statusLabel = backendError
    ? 'Offline'
    : backendStatus?.['Connection Status']
      ? 'Online'
      : 'Checking...';

  const description = backendError
    ? backendError
    : backendStatus?.['Connection Status']
      ? backendStatus['Connection Status']
      : 'Verifying API connectivity...';

  return (
    <main className="main">
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">Run your Rotary club with clarity.</h1>
          <p className="hero__subtitle">
            Centralise members, events, and finances in a single, secure
            workspace built for Rotary clubs.
          </p>
          <div className="hero__actions">
            <button type="button" className="hero__primary-cta">
              Get started
            </button>
            <button type="button" className="hero__secondary-cta">
              View demo
            </button>
          </div>
        </div>

        <div className="hero__highlight">
          <Card
            title="Backend status"
            description={description}
            status={statusLabel}
          />
        </div>
      </section>

      <section className="section section--muted">
        <div className="section__grid">
          {projectsError ? (
            <Card
              title="Projects unavailable"
              description={projectsError}
              status="Error"
            />
          ) : projects.length === 0 ? (
            <Card
              title="No projects yet"
              description="Once projects are added in the admin dashboard, they will appear here with their current status."
              status="Empty"
            />
          ) : (
            projects.slice(0, 3).map((project) => (
              <Card
                key={project.id}
                title={project.title}
                description={project.description}
                status={project.status}
              />
            ))
          )}
        </div>
      </section>
    </main>
  );
}

