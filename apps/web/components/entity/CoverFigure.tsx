"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type CoverFigureProps = {
  src: string;
  srcSet: string;
  sizes: string;
  alt: string;
  width: number;
  height: number;
  children: ReactNode;
};

/** Capa que some, com a legenda, se a imagem não carregar: a página segue inteira, sem imagem quebrada. */
export function CoverFigure({ src, srcSet, sizes, alt, width, height, children }: CoverFigureProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  // A falha pode acontecer antes da hidratação, quando o onError ainda não está ligado.
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return null;
  return (
    <figure className="mt-8">
      {/* WebP já otimizado pelo ortelius; next/image o reprocessaria. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        fetchPriority="high"
        onError={() => setFailed(true)}
        className="mx-auto block h-auto max-h-[32rem] w-auto max-w-full rounded"
      />
      {children}
    </figure>
  );
}
