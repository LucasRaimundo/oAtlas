"use client";

// Detalhes do erro ficam no log do servidor (identificados por error.digest), nunca na tela.
export default function EntityError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <section role="alert" className="mt-16">
      <h1 className="font-serif text-4xl font-semibold">Não foi possível carregar esta entidade</h1>
      <p className="mt-4 leading-relaxed text-cold-white/80">
        O acervo não respondeu agora. Isso costuma ser passageiro.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded border border-gold/60 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold/10"
      >
        Tentar de novo
      </button>
    </section>
  );
}
