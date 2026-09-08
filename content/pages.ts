import type { FAQ } from './site';

export const pageLabels = {
  home: 'Strona główna',
  area: 'Obszar działania',
  contact: 'Kontakt',
  privacy: 'Prywatność',
  service: 'Usługa',
  grossPrice: 'Robocizna brutto · PLN',
  phone: 'Telefon demonstracyjny',
  email: 'E-mail demonstracyjny',
  address: 'Adres demonstracyjny',
  hours: 'Przykładowe godziny pracy',
  map: 'Kraków — granice miasta i dzielnic',
  districts: 'Dzielnice na mapie',
  serviceArea: 'Poznaj obszar dojazdu',
  demo: 'Projekt demonstracyjny',
  notFoundMeta: 'Nie znaleziono strony — 404',
} as const;

export const districtNumbers = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
];

export const areaPage = {
  metaTitle: 'Obszar dojazdu — dzielnice Krakowa (demo)',
  metaDescription:
    'Poznaj demonstracyjny obszar usług AquaFix Pro: wszystkie 18 dzielnic Krakowa. Lista dzielnic, mapa i informacje o planowaniu dojazdu hydraulika.',
  title: 'Hydraulik z dojazdem w Krakowie',
  intro:
    'Stare Miasto, Podgórze, Bronowice czy Nowa Huta — opisany obszar usług obejmuje Kraków. Przy planowaniu wizyty liczy się dokładne miejsce, dostęp do budynku i rodzaj pracy.',
  coverageTitle: '18 dzielnic. Jedno miasto.',
  coverageText:
    'Mapa pokazuje rzeczywiste granice Krakowa i jego dzielnic. Zasięg usług AquaFix Pro jest fikcyjny i służy wyłącznie prezentacji projektu. Żaden punkt na mapie nie oznacza aktywnej ekipy ani potwierdzonego czasu dojazdu.',
  dispatchTitle: 'Co pomaga zaplanować dojazd?',
  dispatchSteps: [
    {
      title: 'Dzielnica i rodzaj budynku',
      text: 'Mieszkanie w kamienicy, blok lub lokal usługowy — opisz miejsce i podaj dzielnicę. Pełny adres ustala się przy potwierdzaniu rzeczywistej wizyty; w demo go nie wpisuj.',
    },
    {
      title: 'Objawy i pilność',
      text: 'Napisz, czy trwa wyciek, woda została odcięta, czy planujesz montaż. Ułatwia to określenie zakresu i potrzebnego przygotowania.',
    },
    {
      title: 'Dostęp i warunki postoju',
      text: 'Przy pracach w centrum istotne mogą być ograniczenia wjazdu, miejsce rozładunku i dostęp do zaworów w częściach wspólnych budynku.',
    },
  ],
  faq: [
    {
      question: 'Czy pokazany zasięg obejmuje cały Kraków?',
      answer:
        'Tak, fikcyjna oferta obejmuje wszystkie 18 dzielnic miasta. Mapa i lista pomagają zobaczyć strukturę obszaru usług; nie potwierdzają dostępności prawdziwej firmy ani ekipy.',
    },
    {
      question: 'Czy można zamówić dojazd poza Kraków?',
      answer:
        'Ten projekt prezentuje usługi wyłącznie w granicach Krakowa. Nie określa dojazdów do sąsiednich gmin ani dopłat kilometrowych. W prawdziwej ofercie takie warunki wymagałyby osobnego ustalenia.',
    },
    {
      question: 'Czy mapa pokazuje aktualną lokalizację hydraulika?',
      answer:
        'Nie. To mapa obszaru demonstracyjnej oferty, bez śledzenia lokalizacji i bez danych o dostępnych ekipach. Adres firmy podany na stronie również jest elementem fikcyjnego scenariusza.',
    },
    {
      question: 'Ile trwa dojazd do mojej dzielnicy?',
      answer:
        'Nie podajemy gwarantowanego czasu dojazdu. W rzeczywistej usłudze zależałby on od dostępności fachowca, ruchu i dostępu do miejsca pracy. AquaFix Pro jest projektem do portfolio i nie realizuje interwencji.',
    },
  ] satisfies FAQ[],
};

export const contactPage = {
  metaTitle: 'Kontakt — hydraulik Kraków (demo)',
  metaDescription:
    'Przetestuj formularz AquaFix Pro i zobacz przykładowe dane kontaktowe hydraulika w Krakowie. To projekt demo — formularz nie zamawia rzeczywistej wizyty.',
  title: 'Opisz problem. Ustalmy następny krok.',
  intro:
    'Wybierz dzielnicę i napisz, co wymaga naprawy lub montażu. W zwykłym zgłoszeniu te informacje pomagają ustalić zakres prac przed dojazdem.',
  demoNotice:
    'Testujesz projekt do portfolio. Używaj wyłącznie fikcyjnych danych. Ten formularz nie zamawia hydraulika, a pokazowy numer telefonu i e-mail nie służą do kontaktu w sprawie prawdziwej awarii.',
  formTitle: 'Wyślij zgłoszenie testowe',
  detailsTitle: 'Przykładowe dane firmy',
  arrivalNote:
    'Adres jest częścią fikcyjnego scenariusza; nie jest punktem przyjęć klientów. Godziny i dyżur awaryjny opisują model oferty demonstracyjnej.',
};

export const privacyPage = {
  metaTitle: 'Prywatność i dane testowe (demo)',
  metaDescription:
    'Jak działa formularz demonstracyjny AquaFix Pro, jakie dane trafiają do logów i kiedy może uruchomić się opcjonalna analityka. Informacja o projekcie demo.',
  title: 'Prywatność w projekcie demonstracyjnym',
  intro:
    'AquaFix Pro jest fikcyjną firmą, a LocalSEO Starter projektem do portfolio. Poniższa informacja opisuje działanie demonstracji i dostępne integracje. Nie jest gotową polityką dla rzeczywistego przedsiębiorstwa.',
  sections: [
    {
      title: '1. Używaj tylko danych testowych',
      paragraphs: [
        'Formularz służy do prezentacji interfejsu i walidacji. Wpisuj fikcyjne imię, telefon, e-mail oraz opis sytuacji. Nie podawaj prawdziwego adresu zamieszkania, danych innych osób ani informacji poufnych.',
        'Telefon, e-mail, adres i godziny firmy widoczne na stronie są danymi demonstracyjnymi. Potwierdzenie formularza nie oznacza przyjęcia rzeczywistego zlecenia ani rezerwacji terminu.',
      ],
    },
    {
      title: '2. Jak działa formularz bez integracji',
      paragraphs: [
        'W domyślnym trybie demonstracyjnym dane trafiają do mechanizmu obsługi formularza na serwerze, są sprawdzane, a strona pokazuje wynik testu. Nie powstaje rezerwacja, konto ani wiadomość do hydraulika.',
        'Log demonstracyjny zawiera wyłącznie informacje techniczne, takie jak obecność pól lub długość tekstu. Nie zapisuje treści imienia, telefonu, e-maila ani wiadomości. Projekt nie przechowuje zgłoszeń we własnej bazie danych.',
      ],
    },
    {
      title: '3. Opcjonalny odbiorca formularza',
      paragraphs: [
        'Osoba wdrażająca stronę może skonfigurować zewnętrzny odbiornik HTTPS. W takim wariancie serwer przekazuje dane formularza do wskazanej usługi. Bez tej konfiguracji integracja jest wyłączona.',
        'Przed włączeniem rzeczywistych zgłoszeń właściciel wdrożenia musi określić administratora, cel i podstawę przetwarzania, odbiorców, okres przechowywania, prawa użytkowników oraz sposób kontaktu i odpowiednio zaktualizować tę stronę.',
      ],
    },
    {
      title: '4. Opcjonalna analityka',
      paragraphs: [
        'Domyślnie analityka Google Analytics 4 jest wyłączona. Jeżeli wdrażający skonfiguruje jej identyfikator, strona poprosi o wybór dotyczący analityki. Przed zgodą nie ładuje skryptów Google Analytics, nie wysyła żądań analitycznych i nie ustawia analitycznych plików cookie.',
        'Po zgodzie mogą być mierzone odsłony oraz zdarzenia click_call i generate_lead. Zdarzenia nie zawierają imienia, telefonu, e-maila ani treści wiadomości z formularza. Sukces formularza w trybie demo oznacza wyłącznie test, a nie rzeczywisty kontakt z klientem.',
        'Wybór dotyczący analityki jest zapamiętywany w przeglądarce. Jeśli analityka jest skonfigurowana, ustawienia można ponownie otworzyć z poziomu stopki. Bez konfiguracji GA4 baner analityczny nie jest potrzebny i nie jest pokazywany.',
      ],
    },
    {
      title: '5. Hosting i dane techniczne',
      paragraphs: [
        'Dostawca hostingu może przetwarzać standardowe informacje techniczne żądań, na przykład adres IP, czas połączenia i dane przeglądarki, zgodnie ze swoją konfiguracją i zasadami. Ta demonstracja nie określa zasad zewnętrznego dostawcy.',
        'Przed wykorzystaniem projektu przez prawdziwą firmę należy uzupełnić dane właściciela, sprawdzić ustawienia hostingu i integracji oraz dostosować informacje o prywatności do rzeczywistego sposobu działania strony.',
      ],
    },
  ],
};
