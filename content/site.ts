export type FAQ = { question: string; answer: string };

export const site = {
  name: 'AquaFix Pro',
  phone: '+48 12 345 67 89',
  phoneHref: 'tel:+48123456789',
  email: 'hello@aquafix-pro.demo',
  address: {
    streetAddress: 'ul. Floriańska 12',
    postalCode: '31-019',
    addressLocality: 'Kraków',
    addressCountry: 'PL',
  },
  geo: { latitude: 50.0614, longitude: 19.9372 },
  hours: {
    weekdays: 'Pon.–pt. 8:00–20:00',
    saturday: 'Sob. 9:00–14:00',
    emergency: 'Awarie: 24/7',
  },
  demoDisclaimer: 'Demo portfolio project — not a real company.',
  districts: [
    'Stare Miasto',
    'Grzegórzki',
    'Prądnik Czerwony',
    'Prądnik Biały',
    'Krowodrza',
    'Bronowice',
    'Zwierzyniec',
    'Dębniki',
    'Łagiewniki-Borek Fałęcki',
    'Swoszowice',
    'Podgórze Duchackie',
    'Bieżanów-Prokocim',
    'Podgórze',
    'Czyżyny',
    'Mistrzejowice',
    'Bieńczyce',
    'Wzgórza Krzesławickie',
    'Nowa Huta',
  ],
};

export const home = {
  title: 'Hydraulik Kraków — awarie i instalacje (demo)',
  description:
    'AquaFix Pro: demonstracyjna strona hydraulika w Krakowie. Awarie, montaż armatury i udrażnianie odpływów. Poznaj zakres usług i przykładowe ceny.',
  heroTitle: 'Spokojna głowa. Nawet gdy pęknie rura.',
  heroText:
    'Hydraulik w Krakowie do pilnych awarii i zaplanowanych prac. Opisz problem, poznaj zakres naprawy i ustal koszt przed rozpoczęciem.',
  whyTitle: 'Wiesz, co naprawiamy. I za co płacisz.',
  whyItems: [
    {
      title: 'Najpierw diagnoza i koszt',
      text: 'Ustalamy przyczynę problemu i zakres prac. Dodatkowe czynności wymagają Twojej zgody — także przy pilnej awarii.',
    },
    {
      title: 'Od zgłoszenia do sprawdzenia',
      text: 'Pytamy o objawy, przygotowujemy potrzebny zakres prac, a po naprawie sprawdzamy szczelność i działanie instalacji.',
    },
    {
      title: 'Z szacunkiem do mieszkania',
      text: 'Zabezpieczenie miejsca pracy, uporządkowanie stanowiska i proste wskazówki na przyszłość są częścią opisanej usługi.',
    },
  ],
  areaText:
    'Od kamienic na Starym Mieście po mieszkania w Nowej Hucie. Przykładowy obszar dojazdu obejmuje wszystkie 18 dzielnic Krakowa. Przy zgłoszeniu podaj dzielnicę i opisz dostęp do instalacji.',
  faqs: [
    {
      question: 'Czy pomoc przy awarii jest dostępna także w nocy?',
      answer:
        'W modelu tej przykładowej oferty przewidziano obsługę awarii przez całą dobę, także w weekendy. AquaFix Pro jest fikcyjną firmą: ta strona nie przyjmuje prawdziwych wezwań i nie zapewnia interwencji.',
    },
    {
      question: 'Ile kosztuje wizyta hydraulika w Krakowie?',
      answer:
        'Cennik demonstracyjny zaczyna się od 150 zł za prosty montaż, 180 zł za podstawową naprawę i 200 zł za udrożnienie odpływu. Przy usługach pokazujemy przykładowe przedziały robocizny; części, dojazd i praca poza zwykłymi godzinami wymagają osobnego ustalenia. To ceny pokazowe, a nie oferta handlowa.',
    },
    {
      question: 'Jakie informacje przygotować przed zgłoszeniem?',
      answer:
        'Podaj dzielnicę, rodzaj usterki, moment jej wystąpienia i informację, czy wodę udało się odciąć. Przy planowanym montażu przyda się model urządzenia oraz opis obecnych przyłączy. W formularzu demonstracyjnym używaj wyłącznie fikcyjnych danych.',
    },
    {
      question: 'Czy zajmujecie się małymi naprawami i montażem?',
      answer:
        'Zakres przykładowej oferty obejmuje między innymi wymianę baterii, syfonu i zaworu, montaż urządzeń sanitarnych oraz drobne naprawy instalacji wodnej. Osobna strona opisuje udrażnianie odpływów. Nie prezentujemy usług gazowych.',
    },
    {
      question: 'Czy mogę tutaj zamówić prawdziwą usługę?',
      answer:
        'Nie. To projekt do portfolio dla fikcyjnej firmy. Telefon, e-mail, adres, godziny pracy i ceny są danymi demonstracyjnymi. Formularz służy do testowania działania strony i nie rezerwuje wizyty.',
    },
  ] satisfies FAQ[],
};
