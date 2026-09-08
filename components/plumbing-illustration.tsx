import Image from 'next/image';
import type { PlumbingImage } from '@/content/visuals';

export function PlumbingIllustration({
  image,
  variant = 'card',
}: {
  image: PlumbingImage;
  variant?: 'intro' | 'card' | 'related';
}) {
  return (
    <Image
      className={`plumbing-illustration plumbing-illustration-${variant}`}
      src={image.src}
      alt={image.alt}
      width={600}
      height={600}
      unoptimized
      preload={variant === 'intro'}
    />
  );
}
