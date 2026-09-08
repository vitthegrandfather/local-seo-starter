'use client';

import type { ComponentProps } from 'react';
import { trackEvent } from '@/lib/analytics';

type CallLinkProps = Omit<ComponentProps<'a'>, 'href' | 'onClick'> & { location?: string };

export function CallLink({
  children = '+48 12 345 67 89',
  location = 'cta',
  ...props
}: CallLinkProps) {
  return (
    <a
      {...props}
      href="tel:+48123456789"
      title="Numer fikcyjny — projekt demonstracyjny, bez obsługi zgłoszeń"
      onClick={() => trackEvent('click_call', { location })}
    >
      {children}
    </a>
  );
}
