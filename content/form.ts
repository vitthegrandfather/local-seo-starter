export const formCopy = {
  requiredNote: 'Wszystkie pola są wymagane. Użyj danych testowych — to formularz demonstracyjny.',
  labels: {
    name: 'Imię i nazwisko',
    phone: 'Telefon',
    email: 'Adres e-mail',
    district: 'Dzielnica Krakowa',
    message: 'Co wymaga naprawy?',
    consent:
      'Zapoznałem się z zasadami prywatności i zgadzam się na przetworzenie wpisanych danych w celu obsługi tego formularza.',
  },
  placeholders: {
    name: 'np. Osoba Testowa',
    phone: 'np. +48 000 000 000',
    email: 'np. test@example.com',
    district: 'Wybierz dzielnicę',
    message:
      'Opisz problem i miejsce, w którym wystąpił. Nie wpisuj dokładnego adresu ani danych wrażliwych.',
  },
  errors: {
    name: 'Podaj imię i nazwisko (od 2 do 100 znaków).',
    phone:
      'Podaj poprawny telefon: od 9 do 15 cyfr. Możesz użyć prefiksu +48, spacji, nawiasów i myślników.',
    email: 'Podaj poprawny adres e-mail (maksymalnie 254 znaki).',
    district: 'Wybierz dzielnicę Krakowa z listy.',
    message: 'Opisz problem w co najmniej 10 znakach (maksymalnie 2000).',
    consent: 'Zaznacz zgodę, aby przetestować formularz.',
  },
  errorSummary: 'Popraw oznaczone pola:',
  submit: 'Wyślij zgłoszenie testowe',
  pending: 'Sprawdzanie zgłoszenia…',
  demoTitle: 'Test formularza zakończony',
  demoSuccess: 'To tylko demonstracja. Wiadomość nie została wysłana do hydraulika.',
  demoDetail:
    'Formularz przeszedł walidację. W trybie demo serwer zapisuje wyłącznie techniczne podsumowanie, bez treści i danych kontaktowych.',
  deliveredTitle: 'Formularz przyjęty przez odbiorcę',
  deliveredSuccess:
    'Dane zostały przekazane do skonfigurowanego odbiorcy formularza. AquaFix Pro nadal jest fikcyjną firmą — nie jest to zamówienie usługi hydraulicznej.',
  retry: 'Wyślij kolejny test',
  networkError:
    'Nie udało się przesłać formularza. Sprawdź połączenie i spróbuj ponownie. Twoje dane pozostały w formularzu.',
  serviceError:
    'Odbiorca formularza jest chwilowo niedostępny. Spróbuj ponownie później. Dane pozostały w formularzu.',
  privacyLabel: 'Przeczytaj zasady prywatności',
  noScript:
    'Aby przetestować formularz, włącz JavaScript w przeglądarce. Ta strona nie obsługuje rzeczywistych zgłoszeń awarii.',
  honeypotLabel: 'Strona internetowa — pozostaw to pole puste',
} as const;

export const analyticsCopy = {
  title: 'Opcjonalne statystyki',
  description:
    'Za Twoją zgodą Google Analytics zmierzy odsłony i kliknięcia przycisków. Nie przesyłamy danych wpisanych w formularzu. Możesz korzystać ze strony bez statystyk.',
  accept: 'Zgadzam się na statystyki',
  reject: 'Bez statystyk',
  settings: 'Ustawienia statystyk',
  close: 'Zamknij ustawienia',
  privacy: 'Zasady prywatności',
} as const;
