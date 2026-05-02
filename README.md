# Synergy OCC - Mobilní Odbavovací Systém

Tato aplikace je moderní webový odbavovací systém pro řidiče MHD (fiktivní i reálné). Obsahuje pokladnu, hlášení zastávek se zvukem gongu DPO a integraci s Firebase pro správu řidičů a historií prodejů.

## Funkce
- 🚌 **Odbavení**: Prodej jízdenek s výpočtem ceny.
- 📢 **Hlášení**: Hlášení zastávek s českým hlasem a gongem Ostrava.
- 🔐 **Bezpečnost**: Přihlášení přes Google nebo E-mail, schvalování řidičů administrátorem.
- 📊 **Historie**: Ukládání tržeb do cloudu v reálném čase.

## Jak zprovoznit na GitHubu

### 1. Klonování a instalace
```bash
git clone <url-vaseho-repozitare>
cd synergy-occ
npm install
```

### 2. Nastavení Firebase
1. Vytvořte projekt v [Firebase Console](https://console.firebase.google.com/).
2. Povolte **Authentication** (Google a Email/Password).
3. Vytvořte **Firestore Database**.
4. Zkopírujte konfigurační údaje do souboru `.env`:
   - Použijte `.env.example` jako šablonu.
   - Přejmenujte ho na `.env` a doplňte své klíče.

### 3. Firestore Security Rules
Nasaďte pravidla ze souboru `firestore.rules` ve svém Firebase projektu pro zajištění bezpečnosti dat.

### 4. Spuštění
```bash
npm run dev
```

## Nasazení (Deployment)
Aplikaci můžete snadno nasadit na **Vercel**, **Netlify** nebo **GitHub Pages**.
```bash
npm run build
```
Nahrajte obsah složky `dist` na svůj hosting.

---
Vyvinuto v AI Studio Build.
