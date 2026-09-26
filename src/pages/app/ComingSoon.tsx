export function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-ink-muted">
        Cette section sera construite dans une prochaine étape, une fois le schéma de données mis
        en place.
      </p>
    </div>
  )
}
