import type { FAQ } from './site';
import { plumbingImages, type PlumbingImage } from './visuals';

export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  heroText: string;
  audience: string;
  included: string[];
  process: { title: string; text: string }[];
  pricing: { label: string; from: number; to: number; note: string }[];
  faq: FAQ[];
  image: PlumbingImage;
};

export const services: Service[] = [
  {
    slug: 'awarie-hydrauliczne',
    title: 'Awarie hydrauliczne w Krakowie',
    shortTitle: 'Awarie hydrauliczne',
    description:
      'Cieknący zawór, pęknięty wężyk lub nagły wyciek. Diagnoza problemu, ustalenie kosztu i naprawa instalacji wodnej.',
    metaTitle: 'Awarie hydrauliczne Kraków — pomoc 24/7 (demo)',
    metaDescription:
      'Przykładowa oferta napraw hydraulicznych w Krakowie: wycieki, zawory i przyłącza. Zobacz zakres, etapy i ceny od 180 zł. Fikcyjna firma, projekt demo.',
    heroText:
      'Woda pod zlewem albo nieszczelny zawór nie muszą oznaczać generalnego remontu. Zaczynamy od ustalenia źródła wycieku i możliwego zakresu naprawy.',
    audience:
      'Dla właścicieli mieszkań, najemców po uzgodnieniu z właścicielem oraz opiekunów małych lokali w Krakowie. Ten zakres dotyczy instalacji wodnej w lokalu. Usterki pionów i części wspólnych wymagają także kontaktu z administracją budynku.',
    included: [
      'Rozpoznanie objawów oraz wskazanie prawdopodobnego źródła nieszczelności.',
      'Ustalenie sposobu odcięcia dopływu wody do naprawianego odcinka.',
      'Wymiana dostępnych wężyków, uszczelek, zaworów i elementów przyłączy w uzgodnionym zakresie.',
      'Sprawdzenie szczelności po naprawie i ponownym uruchomieniu wody.',
      'Informacja o wykonanych pracach i elementach wymagających dalszej diagnostyki.',
    ],
    process: [
      {
        title: 'Opisz, co się dzieje',
        text: 'Podaj dzielnicę Krakowa, miejsce wycieku i informację, czy problem trwa cały czas. Ustalmy też, czy instalacja jest dostępna bez demontażu zabudowy.',
      },
      {
        title: 'Ustalamy wizytę i warunki',
        text: 'Przed dojazdem omawiamy dostępność, koszt diagnostyki oraz ewentualną dopłatę za interwencję w nocy. Nie obiecujemy czasu przyjazdu bez sprawdzenia sytuacji.',
      },
      {
        title: 'Diagnoza, wycena, naprawa',
        text: 'Na miejscu sprawdzamy źródło usterki. Po akceptacji zakresu i ceny wymieniamy uszkodzone elementy lub ustalamy dalsze prace.',
      },
      {
        title: 'Sprawdzamy rezultat',
        text: 'Kontrolujemy połączenia po ponownym uruchomieniu instalacji i wyjaśniamy, na co zwrócić uwagę po zakończeniu wizyty.',
      },
    ],
    pricing: [
      {
        label: 'Drobna naprawa dostępnego przyłącza',
        from: 180,
        to: 320,
        note: 'Przykładowa robocizna brutto za pojedynczy punkt. Bez części, dojazdu i dopłaty nocnej.',
      },
      {
        label: 'Wymiana zaworu lub kilku połączeń',
        from: 280,
        to: 550,
        note: 'Przykładowa robocizna brutto. Zakres zależy od dostępu do instalacji; bez kucia i odtworzenia wykończenia.',
      },
    ],
    faq: [
      {
        question: 'Co zrobić, gdy zauważę wyciek wody?',
        answer:
          'Jeżeli znasz zawór i możesz bezpiecznie do niego dotrzeć, zamknij dopływ wody do urządzenia lub lokalu. Nie dotykaj mokrych gniazd ani urządzeń elektrycznych. Przy zagrożeniu dla ludzi skontaktuj się z odpowiednimi służbami, a w przypadku części wspólnych także z administracją. Numer na tej stronie jest demonstracyjny.',
      },
      {
        question: 'Czy awaria w nocy kosztuje więcej?',
        answer:
          'Przykładowe ceny na stronie dotyczą robocizny w zwykłych godzinach. W tej modelowej ofercie koszt nocnej lub świątecznej interwencji jest ustalany osobno przed dojazdem. Nie pokazujemy jednej ceny dla każdej awarii.',
      },
      {
        question: 'Czy każda naprawa wymaga kucia ściany?',
        answer:
          'Nie zawsze. Dostępne wężyki, syfony czy zawory często pozwalają ograniczyć prace do widocznego przyłącza. Przy nieszczelności ukrytej w ścianie potrzebna może być dodatkowa diagnostyka i osobne uzgodnienie ingerencji w wykończenie.',
      },
      {
        question: 'Czy naprawiacie instalacje w kamienicach?',
        answer:
          'Przykładowy zakres obejmuje także mieszkania w krakowskich kamienicach. Przy starszych instalacjach istotny jest stan rur i możliwość zamknięcia wody. Jeżeli prace dotyczą pionu, warunki odcięcia wody należy uzgodnić z zarządcą.',
      },
      {
        question: 'Czy cena obejmuje materiały i dojazd?',
        answer:
          'Nie. Podane przedziały są demonstracyjnymi cenami robocizny brutto. Części, dojazd i prace poza ustalonym zakresem wymagają osobnej wyceny. AquaFix Pro jest fikcyjną firmą i nie realizuje zleceń.',
      },
    ],
    image: plumbingImages.emergency,
  },
  {
    slug: 'instalacje',
    title: 'Instalacje i montaż hydrauliczny w Krakowie',
    shortTitle: 'Instalacje i montaż',
    description:
      'Montaż baterii, umywalek i urządzeń przy gotowych przyłączach. Szczelne połączenia i sprawdzenie działania po montażu.',
    metaTitle: 'Instalacje hydrauliczne Kraków — montaż (demo)',
    metaDescription:
      'Demo usługi montażu armatury i urządzeń sanitarnych w Krakowie. Zakres prac, etapy, pytania i przykładowe ceny od 150 zł. Poznaj ofertę AquaFix Pro.',
    heroText:
      'Nowa bateria, wymiana umywalki albo podłączenie pralki. Zaplanuj montaż z jasnym zakresem, listą potrzebnych elementów i sprawdzeniem szczelności na koniec.',
    audience:
      'Dla osób urządzających lub odświeżających łazienkę i kuchnię, właścicieli mieszkań na wynajem oraz małych lokali usługowych w Krakowie. Oferta demonstracyjna dotyczy punktowych prac wodno-kanalizacyjnych, bez instalacji gazowych i kompleksowego remontu pomieszczeń.',
    included: [
      'Sprawdzenie zgodności urządzenia z istniejącymi przyłączami i warunkami montażu.',
      'Demontaż starej baterii, syfonu lub urządzenia w uzgodnionym zakresie.',
      'Montaż armatury, umywalki, syfonu lub podłączenie pralki i zmywarki do przygotowanych punktów.',
      'Dobór drobnych elementów przyłączeniowych po uzgodnieniu kosztu materiałów.',
      'Próba działania, kontrola szczelności i uporządkowanie miejsca pracy.',
    ],
    process: [
      {
        title: 'Podaj urządzenie i miejsce',
        text: 'Opisz planowany montaż, model urządzenia oraz stan przyłączy. Przyda się informacja, czy trzeba zdemontować poprzednie wyposażenie.',
      },
      {
        title: 'Ustalamy zakres i materiały',
        text: 'Sprawdzamy, czy potrzebne będą dodatkowe zawory, wężyki lub adaptery. Przed pracą uzgadniamy cenę i to, kto dostarcza poszczególne elementy.',
      },
      {
        title: 'Wykonujemy montaż',
        text: 'Zabezpieczamy miejsce pracy, przygotowujemy połączenia i montujemy wyposażenie zgodnie z uzgodnionym zakresem oraz instrukcją urządzenia.',
      },
      {
        title: 'Uruchamiamy i sprawdzamy',
        text: 'Kontrolujemy dopływ, odpływ i szczelność połączeń. Pokazujemy, gdzie znajduje się zawór odcinający i jak obserwować instalację po montażu.',
      },
    ],
    pricing: [
      {
        label: 'Wymiana baterii przy gotowych przyłączach',
        from: 150,
        to: 280,
        note: 'Przykładowa robocizna brutto. Bez baterii, części przyłączeniowych i dojazdu.',
      },
      {
        label: 'Montaż umywalki z syfonem',
        from: 280,
        to: 500,
        note: 'Przykładowa robocizna brutto przy przygotowanych punktach. Bez ceramiki, przeróbek i prac meblowych.',
      },
      {
        label: 'Podłączenie pralki lub zmywarki',
        from: 170,
        to: 300,
        note: 'Przykładowa robocizna brutto za jedno urządzenie, przy sprawnym dopływie i odpływie.',
      },
    ],
    faq: [
      {
        question: 'Czy muszę samodzielnie kupić baterię lub umywalkę?',
        answer:
          'W przykładowej ofercie podstawowe wyposażenie wybiera i dostarcza klient. Przed zakupem warto sprawdzić wymiary, rodzaj montażu oraz zgodność z przyłączami. Drobne materiały montażowe są ustalane osobno.',
      },
      {
        question: 'Co oznacza montaż przy gotowych przyłączach?',
        answer:
          'Dopływ wody i odpływ są sprawne, dostępne i znajdują się w miejscu pasującym do urządzenia. Przenoszenie punktów, wymiana odcinków rur i ingerencja w ściany wymagają szerszego zakresu oraz odrębnej wyceny.',
      },
      {
        question: 'Czy można zaplanować kilka prac na jedną wizytę?',
        answer:
          'Tak zakłada ten model oferty. W jednym zgłoszeniu można opisać na przykład wymianę baterii, syfonu i podłączenie zmywarki. Łączny koszt wynika z rzeczywistego zakresu; nie jest automatycznie sumą cen początkowych.',
      },
      {
        question: 'Czy zajmujecie się pełnymi remontami łazienek?',
        answer:
          'Ta strona prezentuje punktowe usługi hydrauliczne. Nie obejmuje układania płytek, prac elektrycznych, zabudowy meblowej ani prowadzenia całego remontu. Prace wykraczające poza podany zakres nie są częścią cennika.',
      },
      {
        question: 'Jak przygotować mieszkanie do montażu?',
        answer:
          'Zapewnij dostęp do przyłączy i zaworu odcinającego, opróżnij szafkę pod zlewem oraz przygotuj urządzenie z instrukcją i kompletem elementów. W budynku z wodą odcinaną wspólnie potrzebne może być wcześniejsze uzgodnienie z administracją.',
      },
    ],
    image: plumbingImages.installation,
  },
  {
    slug: 'udraznianie',
    title: 'Udrażnianie odpływów w Krakowie',
    shortTitle: 'Udrażnianie odpływów',
    description:
      'Wolny odpływ w zlewie, umywalce lub prysznicu. Sprawdzenie drożności, dobrana metoda czyszczenia i próba przepływu.',
    metaTitle: 'Udrażnianie odpływów Kraków (demo)',
    metaDescription:
      'Demonstracyjna oferta udrażniania zlewów, umywalek i odpływów w Krakowie. Poznaj sposób pracy, FAQ i przykładowe ceny od 200 zł. AquaFix Pro Demo.',
    heroText:
      'Woda odpływa coraz wolniej lub wraca do brodzika? Zaczynamy od dostępnych elementów i dobieramy sposób udrożnienia do objawów oraz rodzaju instalacji.',
    audience:
      'Dla mieszkańców Krakowa, właścicieli mieszkań na wynajem i małych lokali z niedrożnym odpływem kuchennym lub łazienkowym. Przykładowy zakres obejmuje instalację wewnątrz lokalu; problemy wspólnych pionów wymagają współpracy z administracją.',
    included: [
      'Rozpoznanie objawów: miejsca zatoru, tempa odpływu i występowania problemu w innych punktach.',
      'Kontrola i czyszczenie dostępnego syfonu, jeżeli stan instalacji na to pozwala.',
      'Mechaniczne udrażnianie dostępnego odcinka odpływu metodą dopasowaną do rur i zabudowy.',
      'Ponowne złożenie rozebranych połączeń i kontrola ich szczelności.',
      'Próba przepływu oraz informacja, czy potrzebna jest diagnostyka dalszego odcinka.',
    ],
    process: [
      {
        title: 'Ustalamy objawy',
        text: 'Opisz, gdzie stoi woda, od kiedy trwa problem i czy dotyczy więcej niż jednego odpływu. Powiedz też, czy użyto środków chemicznych.',
      },
      {
        title: 'Sprawdzamy dostęp',
        text: 'Oceniamy syfon, podejście odpływowe i możliwość bezpiecznej pracy. Przed udrażnianiem uzgadniamy metodę oraz koszt.',
      },
      {
        title: 'Usuwamy zator',
        text: 'Czyścimy dostępne elementy lub pracujemy mechanicznie na uzgodnionym odcinku. Jeśli problem leży dalej, omawiamy kolejny krok.',
      },
      {
        title: 'Robimy próbę przepływu',
        text: 'Sprawdzamy odpływ przy puszczonej wodzie i szczelność połączeń. Na koniec przekazujemy wskazówki dotyczące codziennego użytkowania.',
      },
    ],
    pricing: [
      {
        label: 'Czyszczenie syfonu i dostępnego odpływu',
        from: 200,
        to: 350,
        note: 'Przykładowa robocizna brutto za jeden punkt. Bez wymiany części i dojazdu.',
      },
      {
        label: 'Mechaniczne udrożnienie podejścia',
        from: 300,
        to: 600,
        note: 'Przykładowa robocizna brutto. Cena zależy od dostępu i długości odcinka; nie obejmuje prac na sieci zewnętrznej.',
      },
    ],
    faq: [
      {
        question: 'Czy udrażniacie zlewy, umywalki i prysznice?',
        answer:
          'Takie punkty obejmuje prezentowana oferta demonstracyjna. Dobór metody zależy od rodzaju syfonu, materiału rur i dostępu. Niedrożność brodzika z zabudowanym odpływem może wymagać innego zakresu niż czyszczenie syfonu pod umywalką.',
      },
      {
        question: 'Czy mogę dolać kolejny środek do udrażniania?',
        answer:
          'Nie mieszaj preparatów. Postępuj zgodnie z etykietą użytego produktu i poinformuj fachowca, co oraz kiedy zastosowano. Pozostałości środka w stojącej wodzie mają znaczenie dla bezpieczeństwa demontażu i doboru dalszej metody.',
      },
      {
        question: 'Co jeśli woda cofa się w kilku miejscach?',
        answer:
          'Może to wskazywać na problem we wspólnym odcinku odpływu, ale przyczynę trzeba sprawdzić na miejscu. W bloku lub kamienicy zgłoś sytuację również administracji, szczególnie gdy podobne objawy występują u sąsiadów.',
      },
      {
        question: 'Czy jedna wizyta rozwiązuje problem na stałe?',
        answer:
          'Nie można tego obiecać przed diagnozą. Nawracające zatory mogą wynikać ze stanu lub układu instalacji. Po przywróceniu przepływu potrzebna bywa dodatkowa diagnostyka i naprawa odcinka, wyceniana oddzielnie.',
      },
      {
        question: 'Jak ograniczyć ponowne zapychanie odpływu?',
        answer:
          'Używaj sitka do zatrzymywania resztek i włosów, regularnie czyść dostępne elementy zgodnie z instrukcją oraz nie wlewaj tłuszczu do zlewu. Gdy odpływ systematycznie zwalnia mimo czyszczenia, warto sprawdzić przyczynę zamiast powtarzać doraźne działania.',
      },
    ],
    image: plumbingImages.drain,
  },
];
