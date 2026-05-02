# Synergy OCC - Mobilní Kasa / Pokladna

Tato aplikace simuluje palubní počítač (kasu) Mikroelektronika Synergy používanou ve veřejné dopravě. Je optimalizována pro mobilní telefony i tablety.

## Funkce
- **Prodej jízdenek:** Různé druhy jízdenek (základní, zlevněné, denní, zavazadla).
- **Nastavení (Customize):** Možnost přímo v aplikaci změnit číslo linky, cílovou stanici a seznam zastávek.
- **Historie tržeb:** Přehled o prodaných jízdenkách.
- **Responzivní design:** Na mobilu se ovládá jednou rukou, na tabletu/PC má plnohodnotný postranní panel.
- **Offline persistence:** Všechna nastavení zůstávají uložena v prohlížeči (localStorage).

## Jak nahrát na GitHub

1. **GitHub Repository:**
   - Vytvořte si na GitHubu nový repozitář (např. `synergy-kasa`).
   
2. **Export z AI Studio:**
   - V levém horním menu AI Studia vyberte **Settings** -> **Export to GitHub**.
   - Propojte svůj GitHub účet a vyberte vytvořený repozitář.

3. **Nasazení (GitHub Pages):**
   - Po nahrání souborů na GitHub přejděte v repozitáři do **Settings** -> **Pages**.
   - V sekci **Build and deployment** vyberte jako zdroj **GitHub Actions**.
   - Pokud v repozitáři chybí action, můžete použít standardní Vite deployment (budete potřebovat `.github/workflows/deploy.yml`).

## Lokální spuštění
Pokud si aplikaci stáhnete jako ZIP:
```bash
npm install
npm run dev
```

## Build (vytvoření HTML souboru)
Aplikace běží na Reactu, takže se skládá z více souborů. Pokud chcete jeden balíček, který můžete nahrát kamkoliv:
```bash
npm run build
```
Obsah složky `dist` pak nahrajte na svůj hosting nebo GitHub Pages.
