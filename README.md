# Wykończenia Wnętrz – Powiat Przemyski

Strona wizytówka firmy świadczącej usługi remontowo-wykończeniowe na terenie Powiatu Przemyskiego.

## Pliki

- `index.html` – główna strona z sekcjami: O nas, Usługi, Cennik, Realizacje, Kontakt
- `kalkulator-remont.html` – interaktywny kalkulator wyceny (6 kroków), wysyła wynik na e-mail klienta

## Technologie

- Czysty HTML/CSS/JS – brak frameworka, brak procesu budowania
- [Tailwind CSS](https://tailwindcss.com/) (CDN)
- [EmailJS](https://www.emailjs.com/) – wysyłka formularzy bez backendu

## Konfiguracja przed wdrożeniem

W obu plikach HTML uzupełnij:

| Miejsce | Co zmienić |
|---|---|
| `SITE_PUBLIC_KEY` | Klucz publiczny EmailJS |
| `SITE_SERVICE_ID` | ID usługi EmailJS |
| `+48XXXXXXXXX` | Numer telefonu (tel: i wa.me) |

## Uruchomienie lokalnie

Otwórz `index.html` bezpośrednio w przeglądarce lub użyj dowolnego lokalnego serwera HTTP.
