import { BackToGlobe } from "@/components/entity/BackToGlobe";

// Moldura comum à página, ao não encontrada e ao erro: a casca estática que chega antes dos dados.
export default function EntityLayout({ children }: LayoutProps<"/entidade/[slug]">) {
  return (
    <div className="min-h-full bg-deep-blue">
      <main className="mx-auto max-w-[68ch] px-4 py-10 sm:px-6 sm:py-16">
        <BackToGlobe />
        {children}
      </main>
    </div>
  );
}
