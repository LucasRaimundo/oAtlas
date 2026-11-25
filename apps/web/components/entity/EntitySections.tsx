import type { Section } from "@/lib/api/entities";

import { SectionContent } from "./content/SectionContent";

export function EntitySections({ sections }: { sections: Section[] }) {
  const ordered = sections.toSorted((a, b) => a.position - b.position);
  return ordered.map((section) => (
    // O id é a âncora da navegação por seções.
    <section
      key={section.section_key}
      id={section.section_key}
      aria-labelledby={`${section.section_key}-title`}
      className="mt-12 scroll-mt-8"
    >
      <h2 id={`${section.section_key}-title`} className="font-serif text-3xl font-semibold">
        {section.title}
      </h2>
      <SectionContent blocks={section.content} />
    </section>
  ));
}
