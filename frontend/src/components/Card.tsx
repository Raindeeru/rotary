type CardProps = {
  title: string;
  description: string;
  status?: string;
};

export function Card({ title, description, status }: CardProps) {
  return (
    <article className="card">
      <div className="card__body">
        <h3 className="card__title">{title}</h3>
        <p className="card__description">{description}</p>
      </div>
      {status ? (
        <div className="card__status-pill">
          <span className="card__status-dot" />
          <span className="card__status-text">{status}</span>
        </div>
      ) : null}
    </article>
  );
}