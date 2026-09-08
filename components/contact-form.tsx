'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { formCopy } from '@/content/form';
import { site } from '@/content/site';
import { trackEvent } from '@/lib/analytics';
import {
  contactFields,
  contactLimits,
  validateContact,
  type ContactErrors,
  type ContactField,
} from '@/lib/contact-validation';

type SubmitStatus = 'idle' | 'pending' | 'demo' | 'delivered';

export function ContactForm() {
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [notice, setNotice] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (status === 'demo' || status === 'delivered') successRef.current?.focus();
  }, [status]);

  function showErrors(nextErrors: ContactErrors) {
    setErrors(nextErrors);
    const firstField = contactFields.find((field) => nextErrors[field]);
    if (firstField)
      requestAnimationFrame(() => {
        const control = formRef.current?.elements.namedItem(firstField);
        if (control instanceof HTMLElement) control.focus();
      });
  }

  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ))
      return;
    const field = target.name as ContactField;
    if (errors[field])
      setErrors((previous) => {
        const next = { ...previous };
        delete next[field];
        return next;
      });
    if (notice) setNotice('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    const formData = new FormData(event.currentTarget);
    const input = Object.fromEntries(formData.entries());
    const validation = validateContact({ ...input, consent: formData.get('consent') === 'on' });
    setNotice('');
    if (!validation.valid) {
      showErrors(validation.errors);
      return;
    }
    setErrors({});
    pendingRef.current = true;
    setStatus('pending');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
        signal: AbortSignal.timeout(12_000),
      });
      const result = await response.json();
      if (response.status === 422 && result.errors) {
        const serverErrors: ContactErrors = {};
        for (const field of contactFields) {
          if (typeof result.errors[field] === 'string') serverErrors[field] = result.errors[field];
        }
        showErrors(serverErrors);
        setStatus('idle');
        return;
      }
      if (!response.ok || result.ok !== true || !['demo', 'delivered'].includes(result.mode)) {
        setNotice(formCopy.serviceError);
        setStatus('idle');
        return;
      }
      setStatus(result.mode);
      if (result.mode === 'delivered') trackEvent('generate_lead', { location: 'form' });
    } catch {
      setNotice(formCopy.networkError);
      setStatus('idle');
    } finally {
      pendingRef.current = false;
    }
  }

  function fieldError(field: ContactField) {
    return errors[field] ? (
      <p id={`${field}-error`} className="field-error">
        {errors[field]}
      </p>
    ) : null;
  }

  const fieldA11y = (field: ContactField) => ({
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
  });

  if (status === 'demo' || status === 'delivered') {
    return (
      <div
        className="success-panel"
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
      >
        <span className="success-mark" aria-hidden="true">
          ✓
        </span>
        <h3>{status === 'demo' ? formCopy.demoTitle : formCopy.deliveredTitle}</h3>
        <p>{status === 'demo' ? formCopy.demoSuccess : formCopy.deliveredSuccess}</p>
        {status === 'demo' && <p>{formCopy.demoDetail}</p>}
        <button
          className="button button-secondary"
          type="button"
          onClick={() => {
            setStatus('idle');
            requestAnimationFrame(() => {
              const name = formRef.current?.elements.namedItem('name');
              if (name instanceof HTMLElement) name.focus();
            });
          }}
        >
          {formCopy.retry}
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className="contact-form"
      onSubmit={submit}
      onInput={clearFieldError}
      noValidate
      aria-describedby="form-required"
      aria-busy={status === 'pending'}
    >
      <p id="form-required" className="form-notice">
        {formCopy.requiredNote}
      </p>
      <noscript>
        <p className="form-notice">{formCopy.noScript}</p>
      </noscript>
      {Object.keys(errors).length > 0 && (
        <div className="form-error-summary" role="alert">
          <p>{formCopy.errorSummary}</p>
          <ul>
            {contactFields
              .filter((field) => errors[field])
              .map((field) => (
                <li key={field}>
                  <a href={`#${field}`}>{errors[field]}</a>
                </li>
              ))}
          </ul>
        </div>
      )}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">{formCopy.labels.name}</label>
          <input
            className="input"
            id="name"
            name="name"
            autoComplete="name"
            placeholder={formCopy.placeholders.name}
            required
            minLength={2}
            maxLength={contactLimits.name}
            {...fieldA11y('name')}
          />
          {fieldError('name')}
        </div>
        <div className="field">
          <label htmlFor="phone">{formCopy.labels.phone}</label>
          <input
            className="input"
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={formCopy.placeholders.phone}
            required
            maxLength={contactLimits.phone}
            {...fieldA11y('phone')}
          />
          {fieldError('phone')}
        </div>
        <div className="field">
          <label htmlFor="email">{formCopy.labels.email}</label>
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={formCopy.placeholders.email}
            required
            maxLength={contactLimits.email}
            {...fieldA11y('email')}
          />
          {fieldError('email')}
        </div>
        <div className="field">
          <label htmlFor="district">{formCopy.labels.district}</label>
          <select
            className="input"
            id="district"
            name="district"
            defaultValue=""
            required
            {...fieldA11y('district')}
          >
            <option value="" disabled>
              {formCopy.placeholders.district}
            </option>
            {site.districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
          {fieldError('district')}
        </div>
        <div className="field field-wide">
          <label htmlFor="message">{formCopy.labels.message}</label>
          <textarea
            className="input"
            id="message"
            name="message"
            rows={5}
            placeholder={formCopy.placeholders.message}
            required
            minLength={10}
            maxLength={contactLimits.message}
            {...fieldA11y('message')}
          />
          {fieldError('message')}
        </div>
        <div className="field field-wide">
          <div className="consent-row">
            <input id="consent" name="consent" type="checkbox" required {...fieldA11y('consent')} />
            <label htmlFor="consent">
              {formCopy.labels.consent}{' '}
              <Link href="/polityka-prywatnosci">{formCopy.privacyLabel}</Link>.
            </label>
          </div>
          {fieldError('consent')}
        </div>
      </div>
      <div hidden aria-hidden="true">
        <label htmlFor="website">{formCopy.honeypotLabel}</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          maxLength={200}
        />
      </div>
      <p className="status field-error" role="alert" aria-live="assertive">
        {notice}
      </p>
      <button className="button button-primary" type="submit" disabled={status === 'pending'}>
        {status === 'pending' ? formCopy.pending : formCopy.submit}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {status === 'pending' ? formCopy.pending : ''}
      </span>
    </form>
  );
}
