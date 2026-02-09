# ⛽ FuelTracker

**Gestione intelligente dei rifornimenti carburante**

App web mobile-first per tracciare rifornimenti, analizzare consumi e monitorare le spese della tua auto.

---

## 🚀 Caratteristiche

### 📝 Gestione Rifornimenti
- ➕ Inserimento rapido e intuitivo
- 🔄 Distinzione tra rifornimento Pieno/Parziale
- 🏙️ Categorizzazione per tipo guida (Città/Misto/Autostrada)
- 📝 Note personalizzate per ogni rifornimento
- 💰 Calcolo automatico della spesa

### 📊 Analisi Consumi
- 📈 Grafico trend consumo L/100km
- 📉 Media mobile a 3 rifornimenti
- 🎯 Analisi solo dei rifornimenti PIENI (i parziali sono esclusi)
- 🔍 Filtro per tipo guida
- ✅ Valutazione consumo (buono/medio/cattivo)

### 📈 Dashboard Statistiche
- 💰 **Indicatori Economici**: Spesa totale, costo/km, prezzo medio
- 🚗 **Indicatori Utilizzo**: Km totali, numero rifornimenti, litri totali
- ⛽ **Indicatori Consumo**: Media, migliore, peggiore
- 📊 Confronto consumo per tipo guida

### 💾 Import/Export
- 📥 Importa dati da CSV esistente
- 💾 Esporta backup in formato CSV
- 🔄 Compatibile con formato Excel/Numbers italiano (separatore `;`, decimali `,`)

---

## 📱 Tecnologie

- **HTML5/CSS3/JavaScript** - Vanilla, nessun framework
- **Chart.js** - Grafici interattivi
- **localStorage** - Salvataggio dati locale
- **PWA Ready** - Installabile come app
- **Mobile-First** - Ottimizzato per smartphone

---

## 🎯 Come Usare

### 1️⃣ Primo Avvio

1. Apri `index.html` nel browser
2. (Opzionale) Importa il tuo CSV esistente cliccando 📥
3. Inizia ad aggiungere rifornimenti con ➕

### 2️⃣ Aggiungere Rifornimento

1. Clicca **➕ Nuovo** nella tab Rifornimenti
2. Compila:
   - 📅 Data
   - 🚗 Km Totali (lettura contachilometri)
   - ⛽ Litri Riforniti
   - 💶 Prezzo al Litro
   - La spesa viene **calcolata automaticamente**
3. Seleziona:
   - Tipo: **Pieno** o **Parziale**
   - Guida: **Città** / **Misto** / **Autostrada**
4. Aggiungi note (opzionale)
5. Clicca **Salva**

### 3️⃣ Analizzare i Consumi

1. Vai nella tab **📊 Analisi**
2. Visualizza:
   - Grafico trend consumo
   - Lista dettagliata con km percorsi e L/100km
   - Media mobile (dal 3° rifornimento)
3. Filtra per tipo guida dal menu a tendina

### 4️⃣ Consultare Statistiche

1. Vai nella tab **📈 Dashboard**
2. Consulta:
   - Costi totali e medi
   - Consumo medio, migliore, peggiore
   - Confronto consumo per tipo guida

### 5️⃣ Export/Import

- **Esporta**: Clicca 💾 nell'header → Scarica CSV
- **Importa**: Clicca 📥 nell'header → Seleziona file CSV

---

## 📐 Logica di Calcolo

### ⛽ Analisi Consumi

**IMPORTANTE**: Solo i rifornimenti **PIENI** vengono analizzati. I **PARZIALI** sono ignorati.

#### Formula Consumo L/100km:
```
L/100km = (Litri × 100) / Km Percorsi

dove:
Km Percorsi = Km attuale - Km pieno precedente
```

#### Media Mobile (ultimi 3 pieni):
```
Media Mobile = AVERAGE(Consumo-2, Consumo-1, Consumo attuale)
```

### 📊 Dashboard

#### Indicatori Economici:
```
Spesa Totale = SUM(tutte le spese)
Km Totali = MAX(km) - MIN(km)
Costo per Km = Spesa Totale / Km Totali
Costo per 100 km = Costo per Km × 100
Prezzo Medio = AVERAGE(tutti i prezzi/litro)
```

#### Indicatori Consumo:
```
Consumo Medio = AVERAGE(L/100km di tutti i pieni)
Consumo Migliore = MIN(L/100km)
Consumo Peggiore = MAX(L/100km)
```

---

## 📁 Struttura Progetto

```
FuelTracker/
├── index.html              # Pagina principale
├── manifest.json           # PWA manifest
├── css/
│   └── style.css          # Stili mobile-first
├── js/
│   ├── app.js             # Logic principale
│   ├── storage.js         # Gestione CSV + localStorage
│   ├── calculations.js    # Formule calcolo consumi
│   └── charts.js          # Grafici Chart.js
├── data/
│   └── template.csv       # Template CSV di esempio
└── README.md              # Questa documentazione
```

---

## 📋 Formato CSV

Il file CSV usa il formato **italiano**:
- Separatore colonne: `;` (punto e virgola)
- Separatore decimali: `,` (virgola)

### Esempio:
```csv
Data;Km Totali;Litri Riforniti;Prezzo al Litro (€/L);Spesa Totale (€);Tipo Rifornimento;Tipo Guida;Note
30/01/2026;183724;43,200;1,680;72,58;Pieno;Misto;
02/02/2026;184474;41,500;1,650;68,48;Pieno;Misto;
05/02/2026;184900;15,000;1,700;25,50;Parziale;Città;Emergenza
```

---

## 🔒 Privacy & Sicurezza

- ✅ **100% Offline** - Tutti i dati restano sul tuo dispositivo
- ✅ **Nessun Server** - Zero invio dati online
- ✅ **localStorage** - Persistenza locale sicura
- ✅ **Export CSV** - Backup completo dei tuoi dati

**ATTENZIONE**: Se cancelli i dati del browser, perdi tutti i rifornimenti. Fai backup regolari con l'export CSV!

---

## 🌐 Installazione PWA

### Su Android/Chrome:
1. Apri l'app nel browser
2. Menu → "Aggiungi a schermata Home"
3. L'app apparirà come icona standalone

### Su iOS/Safari:
1. Apri l'app in Safari
2. Tap su "Condividi" (icona freccia)
3. "Aggiungi a Home"

---

## 🛠️ Sviluppo Futuro

Possibili miglioramenti:
- [ ] Service Worker per funzionamento offline completo
- [ ] Dark Mode
- [ ] Notifiche reminder rifornimento
- [ ] Supporto multi-veicolo
- [ ] Upload foto ricevute
- [ ] Sync cloud opzionale (Google Drive, Dropbox)
- [ ] Export PDF report mensili

---

## 📞 Supporto

Per bug o suggerimenti, apri una Issue su GitHub.

---

## 📄 Licenza

MIT License - Libero per uso personale e commerciale.

---

**Buon viaggio! 🚗💨**
