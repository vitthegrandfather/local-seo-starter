/** Server-rendered structured data, with HTML-safe JSON serialization. */
export function JsonLd({ data }: { data: object | readonly object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
