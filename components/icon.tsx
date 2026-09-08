import {
  ArrowRight,
  Check,
  Clock3,
  Droplet,
  FileText,
  Heater,
  Mail,
  MapPin,
  Phone,
  Waves,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { SVGProps } from 'react';

const icons: Record<string, LucideIcon> = {
  phone: Phone,
  arrow: ArrowRight,
  check: Check,
  pin: MapPin,
  clock: Clock3,
  document: FileText,
  pipe: Wrench,
  radiator: Heater,
  drain: Waves,
  mail: Mail,
  drop: Droplet,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: string }) {
  const IconComponent = icons[name] ?? ArrowRight;

  return (
    <IconComponent size={24} strokeWidth={1.75} {...props} aria-hidden="true" focusable="false" />
  );
}
