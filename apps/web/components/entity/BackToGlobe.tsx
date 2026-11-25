import Link from "next/link";

export function BackToGlobe() {
  return (
    <Link href="/" className="text-sm text-cold-white/70 transition-colors hover:text-gold">
      ← Voltar ao globo
    </Link>
  );
}
