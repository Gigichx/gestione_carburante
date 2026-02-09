// ===== STORAGE MODULE =====
// Gestisce localStorage, import/export CSV

const Storage = {
    STORAGE_KEY: 'fueltracker_data',

    // Carica dati da localStorage
    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Errore caricamento dati:', error);
            return [];
        }
    },

    // Salva dati in localStorage
    save(rifornimenti) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rifornimenti));
            return true;
        } catch (error) {
            console.error('Errore salvataggio dati:', error);
            alert('Errore nel salvataggio dei dati!');
            return false;
        }
    },

    // Aggiungi rifornimento
    add(rifornimento) {
        const rifornimenti = this.load();
        rifornimento.id = Date.now().toString();
        rifornimenti.push(rifornimento);
        this.save(rifornimenti);
        return rifornimento;
    },

    // Elimina rifornimento
    delete(id) {
        const rifornimenti = this.load();
        const filtered = rifornimenti.filter(r => r.id !== id);
        this.save(filtered);
    },

    // Pulisci tutti i dati
    clear() {
        if (confirm('Sei sicuro di voler eliminare TUTTI i dati?')) {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        }
        return false;
    },

    // ===== EXPORT CSV =====
    exportCSV() {
        const rifornimenti = this.load();
        
        if (rifornimenti.length === 0) {
            alert('Nessun dato da esportare!');
            return;
        }

        // Header CSV (separatore punto e virgola, decimali con virgola)
        let csv = 'Data;Km Totali;Litri Riforniti;Prezzo al Litro (€/L);Spesa Totale (€);Tipo Rifornimento;Tipo Guida;Note\n';

        // Ordina per data
        const sorted = [...rifornimenti].sort((a, b) => 
            new Date(a.data) - new Date(b.data)
        );

        // Aggiungi righe
        sorted.forEach(r => {
            const data = this.formatDateIT(r.data);
            const km = this.formatNumber(r.km, 0);
            const litri = this.formatNumber(r.litri, 3);
            const prezzo = this.formatNumber(r.prezzoLitro, 3);
            const spesa = this.formatNumber(r.spesa, 0);
            const tipo = r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1);
            const guida = r.guida.charAt(0).toUpperCase() + r.guida.slice(1);
            const note = r.note || '';

            csv += `${data};${km};${litri};${prezzo};${spesa};${tipo};${guida};${note}\n`;
        });

        // Download file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `FuelTracker_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // ===== IMPORT CSV =====
    importCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const rifornimenti = this.parseCSV(text);
                    
                    if (rifornimenti.length === 0) {
                        reject(new Error('Nessun dato trovato nel CSV'));
                        return;
                    }

                    // Chiedi conferma prima di sovrascrivere
                    const currentData = this.load();
                    if (currentData.length > 0) {
                        if (!confirm(`Hai già ${currentData.length} rifornimenti. Vuoi sostituirli con i ${rifornimenti.length} del CSV?`)) {
                            reject(new Error('Importazione annullata'));
                            return;
                        }
                    }

                    this.save(rifornimenti);
                    resolve(rifornimenti.length);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Errore lettura file'));
            reader.readAsText(file, 'UTF-8');
        });
    },

    // Parser CSV
    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const rifornimenti = [];

        // Cerca l'header (può essere in diverse righe)
        let headerIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Data') && lines[i].includes('Km Totali')) {
                headerIndex = i;
                break;
            }
        }

        if (headerIndex === -1) {
            throw new Error('Header CSV non trovato');
        }

        // Parsea le righe dati
        for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Salta righe vuote o di intestazione
            if (!line || line.startsWith('Analisi:') || line.startsWith('Dashboard:')) {
                break;
            }

            const parts = line.split(';');
            
            if (parts.length >= 7) {
                try {
                    const rifornimento = {
                        id: Date.now().toString() + i,
                        data: this.parseDate(parts[0]),
                        km: this.parseNumber(parts[1]),
                        litri: this.parseNumber(parts[2]),
                        prezzoLitro: this.parseNumber(parts[3]),
                        spesa: this.parseNumber(parts[4]),
                        tipo: parts[5].toLowerCase().includes('pieno') ? 'pieno' : 'parziale',
                        guida: parts[6].toLowerCase().trim(),
                        note: parts[7] || ''
                    };

                    // Validazione base
                    if (rifornimento.data && rifornimento.km > 0 && rifornimento.litri > 0) {
                        rifornimenti.push(rifornimento);
                    }
                } catch (error) {
                    console.warn('Riga CSV ignorata:', line, error);
                }
            }
        }

        return rifornimenti;
    },

    // ===== UTILITY =====
    
    // Converte data da DD/MM/YYYY a YYYY-MM-DD
    parseDate(dateStr) {
        const parts = dateStr.trim().split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
        return dateStr;
    },

    // Formatta data da YYYY-MM-DD a DD/MM/YYYY
    formatDateIT(dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    },

    // Parsea numero (gestisce virgola come separatore decimale)
    parseNumber(str) {
        if (typeof str === 'number') return str;
        return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    },

    // Formatta numero (punto migliaia, virgola decimali)
    formatNumber(num, decimals = 2) {
        return num.toLocaleString('it-IT', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).replace(/\./g, '.');
    }
};
