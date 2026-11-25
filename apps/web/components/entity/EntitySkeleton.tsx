export function EntitySkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando a entidade" className="mt-10 animate-pulse">
      <div className="h-3 w-20 rounded bg-cold-white/10" />
      <div className="mt-4 h-12 w-2/3 rounded bg-cold-white/10" />
      <div className="mt-6 h-4 w-full rounded bg-cold-white/10" />
      <div className="mt-2 h-4 w-5/6 rounded bg-cold-white/10" />
    </div>
  );
}
