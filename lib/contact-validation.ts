import { formCopy } from '@/content/form';
import { site } from '@/content/site';

export const contactFields = ['name', 'phone', 'email', 'district', 'message', 'consent'] as const;
export type ContactField = (typeof contactFields)[number];
export type ContactErrors = Partial<Record<ContactField, string>>;
export type ContactPayload = {
  name: string;
  phone: string;
  email: string;
  district: string;
  message: string;
  consent: boolean;
  website: string;
};

export const contactLimits = { name: 100, phone: 40, email: 254, message: 2000 } as const;

export function validateContact(
  input: unknown,
): { valid: true; data: ContactPayload; spam: boolean } | { valid: false; errors: ContactErrors } {
  const value =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const readString = (key: string) => (typeof value[key] === 'string' ? value[key].trim() : '');
  const data: ContactPayload = {
    name: readString('name'),
    phone: readString('phone'),
    email: readString('email'),
    district: readString('district'),
    message: readString('message'),
    consent: value.consent === true,
    website: readString('website'),
  };
  const errors: ContactErrors = {};
  if (
    data.name.length < 2 ||
    data.name.length > contactLimits.name ||
    /[\r\n\u0000]/.test(data.name)
  ) {
    errors.name = formCopy.errors.name;
  }
  const digits = data.phone.replace(/\D/g, '');
  if (
    data.phone.length > contactLimits.phone ||
    !/^\+?[\d ()-]+$/.test(data.phone) ||
    digits.length < 9 ||
    digits.length > 15
  ) {
    errors.phone = formCopy.errors.phone;
  }
  if (
    data.email.length > contactLimits.email ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email)
  ) {
    errors.email = formCopy.errors.email;
  }
  if (!(site.districts as readonly string[]).includes(data.district))
    errors.district = formCopy.errors.district;
  if (
    data.message.length < 10 ||
    data.message.length > contactLimits.message ||
    data.message.includes('\u0000')
  ) {
    errors.message = formCopy.errors.message;
  }
  if (!data.consent) errors.consent = formCopy.errors.consent;
  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return { valid: true, data, spam: Boolean(data.website) };
}
