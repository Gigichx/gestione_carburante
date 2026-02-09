// ===== CALCULATIONS MODULE =====
// Implementa la logica di calcolo esattamente come nel tuo Excel

const Calculations = {
    
    // ===== ANALISI RIFORNIMENTI PIENI =====
    
    // Filtra solo i rifornimenti PIENI (i parziali sono ignorati)
    getPieniOnly(rifornimenti) {
        return rifornimenti
            .filter(r => r.tipo === 'pieno')
            .sort((a, b) => new Date(a.data) - new Date(b.data));
    },

    // Calcola analisi completa (come foglio Analisi)
    calculateAnalysis(rifornimenti, filterGuida = 'tutti') {
        let pieni = this.getPieniOnly(rifornimenti);

        // Filtra per tipo guida se richiesto
        if (filterGuida !== 'tutti') {
            pieni = pieni.filter(p => p.guida === filterGuida);
        }

        if (pieni.length < 2) {
            return []; // Serve almeno 2 pieni per calcolare
        }

        const analysis = [];

        // Il primo pieno è solo riferimento (no calcoli)
        // Iniziamo dal secondo pieno (indice 1)
        for (let i = 1; i < pieni.length; i++) {
            const current = pieni[i];
            const previous = pieni[i - 1];

            // Km Percorsi = Km attuale - Km precedente
            const kmPercorsi = current.km - previous.km;

            // Consumo km/L = Km / Litri
            const consumoKmL = kmPercorsi > 0 ? kmPercorsi / current.litri : 0;

            // Consumo L/100km = (Litri × 100) / Km
            const consumoL100km = kmPercorsi > 0 ? (current.litri * 100) / kmPercorsi : 0;

            // Media Mobile 3 = Media degli ultimi 3 consumi L/100km
            let mediaMobile3 = null;
            if (i >= 2) { // Dal 3° pieno in poi (indice 2)
                const consumi = [];
                for (let j = Math.max(0, i - 2); j <= i; j++) {
                    if (j > 0) { // Salta il primo pieno
                        const prev = pieni[j - 1];
                        const curr = pieni[j];
                        const km = curr.km - prev.km;
                        if (km > 0) {
                            consumi.push((curr.litri * 100) / km);
                        }
                    }
                }
                if (consumi.length > 0) {
                    mediaMobile3 = consumi.reduce((a, b) => a + b, 0) / consumi.length;
                }
            }

            analysis.push({
                numero: i, // 1, 2, 3...
                data: current.data,
                km: current.km,
                litri: current.litri,
                guida: current.guida,
                kmPercorsi,
                consumoKmL,
                consumoL100km,
                mediaMobile3,
                spesa: current.spesa,
                id: current.id
            });
        }

        return analysis;
    },

    // ===== DASHBOARD STATISTICS =====
    
    calculateDashboard(rifornimenti) {
        if (rifornimenti.length === 0) {
            return this.getEmptyDashboard();
        }

        const sorted = [...rifornimenti].sort((a, b) => new Date(a.data) - new Date(b.data));
        const pieni = this.getPieniOnly(rifornimenti);
        const analysis = this.calculateAnalysis(rifornimenti);

        // 💰 INDICATORI ECONOMICI
        
        // Spesa Totale = SUM(tutte le spese)
        const spesaTotale = rifornimenti.reduce((sum, r) => sum + r.spesa, 0);

        // Km Totali = MAX(km) - MIN(km)
        const kmTotali = sorted.length > 0 
            ? sorted[sorted.length - 1].km - sorted[0].km 
            : 0;

        // Costo per Km = Spesa Totale / Km Totali
        const costoKm = kmTotali > 0 ? spesaTotale / kmTotali : 0;

        // Costo per 100 km = Costo per Km × 100
        const costo100Km = costoKm * 100;

        // Prezzo Medio = AVERAGE(tutti i prezzi al litro)
        const prezzoMedio = rifornimenti.reduce((sum, r) => sum + r.prezzoLitro, 0) / rifornimenti.length;

        // 🚗 INDICATORI UTILIZZO
        
        const totaleRifornimenti = rifornimenti.length;

        // Litri Totali = SUM(tutti i litri)
        const litriTotali = rifornimenti.reduce((sum, r) => sum + r.litri, 0);

        // ⛽ INDICATORI CONSUMO (solo dai pieni)
        
        let consumoMedio = null;
        let consumoMigliore = null;
        let consumoPeggiore = null;

        if (analysis.length > 0) {
            const consumi = analysis.map(a => a.consumoL100km);
            
            // Consumo Medio = AVERAGE(L/100km di tutti i pieni analizzati)
            consumoMedio = consumi.reduce((sum, c) => sum + c, 0) / consumi.length;
            
            // Consumo Migliore = MIN(L/100km)
            consumoMigliore = Math.min(...consumi);
            
            // Consumo Peggiore = MAX(L/100km)
            consumoPeggiore = Math.max(...consumi);
        }

        // 📊 CONSUMO PER TIPO GUIDA
        const consumoPerGuida = this.calculateConsumoPerGuida(rifornimenti);

        return {
            economici: {
                spesaTotale,
                costoKm,
                costo100Km,
                prezzoMedio
            },
            utilizzo: {
                kmTotali,
                totaleRifornimenti,
                litriTotali
            },
            consumo: {
                consumoMedio,
                consumoMigliore,
                consumoPeggiore
            },
            consumoPerGuida
        };
    },

    // Calcola consumo medio per tipo guida
    calculateConsumoPerGuida(rifornimenti) {
        const tipi = ['città', 'misto', 'autostrada'];
        const result = {};

        tipi.forEach(tipo => {
            const analysis = this.calculateAnalysis(rifornimenti, tipo);
            if (analysis.length > 0) {
                const consumi = analysis.map(a => a.consumoL100km);
                result[tipo] = consumi.reduce((sum, c) => sum + c, 0) / consumi.length;
            } else {
                result[tipo] = null;
            }
        });

        return result;
    },

    // Dashboard vuota (nessun dato)
    getEmptyDashboard() {
        return {
            economici: {
                spesaTotale: 0,
                costoKm: 0,
                costo100Km: 0,
                prezzoMedio: 0
            },
            utilizzo: {
                kmTotali: 0,
                totaleRifornimenti: 0,
                litriTotali: 0
            },
            consumo: {
                consumoMedio: null,
                consumoMigliore: null,
                consumoPeggiore: null
            },
            consumoPerGuida: {
                città: null,
                misto: null,
                autostrada: null
            }
        };
    },

    // ===== UTILITY =====

    // Formatta numero con 2 decimali
    formatNumber(num, decimals = 2) {
        if (num === null || num === undefined) return '-';
        return num.toLocaleString('it-IT', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    // Formatta valuta Euro
    formatCurrency(num, decimals = 2) {
        if (num === null || num === undefined) return '€0.00';
        return '€' + this.formatNumber(num, decimals);
    },

    // Valuta se un consumo è buono/cattivo rispetto alla media
    evaluateConsumption(consumo, media) {
        if (!media || !consumo) return 'neutral';
        const diff = ((consumo - media) / media) * 100;
        if (diff < -5) return 'good'; // 5% meglio della media
        if (diff > 5) return 'bad';   // 5% peggio della media
        return 'neutral';
    },

    // ===== STATISTICHE MENSILI =====

    // Ottieni dati aggregati per mese
    getMonthlyStats(rifornimenti) {
        const monthlyData = {};

        rifornimenti.forEach(r => {
            const date = new Date(r.data);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    year: date.getFullYear(),
                    month: date.getMonth() + 1,
                    monthKey: monthKey,
                    rifornimenti: [],
                    spesaTotale: 0,
                    litriTotali: 0,
                    numRifornimenti: 0,
                    prezzoMedio: 0
                };
            }

            monthlyData[monthKey].rifornimenti.push(r);
            monthlyData[monthKey].spesaTotale += r.spesa;
            monthlyData[monthKey].litriTotali += r.litri;
            monthlyData[monthKey].numRifornimenti++;
        });

        // Calcola medie e km per ogni mese
        Object.values(monthlyData).forEach(month => {
            const sorted = month.rifornimenti.sort((a, b) => new Date(a.data) - new Date(b.data));
            
            if (sorted.length > 0) {
                month.kmTotali = sorted[sorted.length - 1].km - sorted[0].km;
                month.prezzoMedio = month.rifornimenti.reduce((sum, r) => sum + r.prezzoLitro, 0) / month.rifornimenti.length;
                
                // Calcola consumo medio del mese (solo pieni)
                const analysis = this.calculateAnalysis(month.rifornimenti);
                if (analysis.length > 0) {
                    const consumi = analysis.map(a => a.consumoL100km);
                    month.consumoMedio = consumi.reduce((a, b) => a + b, 0) / consumi.length;
                } else {
                    month.consumoMedio = null;
                }
            }
        });

        return monthlyData;
    },

    // Ottieni statistiche per un mese specifico
    getMonthStats(rifornimenti, year, month) {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        const monthlyData = this.getMonthlyStats(rifornimenti);
        return monthlyData[monthKey] || null;
    },

    // Confronta due mesi
    compareMonths(rifornimenti, year1, month1, year2, month2) {
        const current = this.getMonthStats(rifornimenti, year1, month1);
        const previous = this.getMonthStats(rifornimenti, year2, month2);

        if (!current) return null;

        const comparison = {
            current: current,
            previous: previous,
            changes: {}
        };

        if (previous) {
            // Calcola variazioni percentuali
            comparison.changes.spesa = this.calculateChange(previous.spesaTotale, current.spesaTotale);
            comparison.changes.consumo = current.consumoMedio && previous.consumoMedio 
                ? this.calculateChange(previous.consumoMedio, current.consumoMedio)
                : null;
            comparison.changes.prezzo = this.calculateChange(previous.prezzoMedio, current.prezzoMedio);
            comparison.changes.km = this.calculateChange(previous.kmTotali, current.kmTotali);
        }

        return comparison;
    },

    // Calcola variazione percentuale
    calculateChange(oldValue, newValue) {
        if (!oldValue || oldValue === 0) return null;
        const change = ((newValue - oldValue) / oldValue) * 100;
        return {
            value: newValue - oldValue,
            percent: change,
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
        };
    },

    // ===== INSIGHTS INTELLIGENTI =====

    generateInsights(rifornimenti) {
        const insights = [];
        
        if (rifornimenti.length < 3) {
            return [{
                type: 'info',
                icon: 'ℹ️',
                text: 'Aggiungi più rifornimenti per ricevere insights personalizzati sui tuoi consumi.'
            }];
        }

        const dashboard = this.calculateDashboard(rifornimenti);
        const pieni = this.getPieniOnly(rifornimenti);
        
        // Insight 1: Confronto mensile
        const now = new Date();
        const currentMonth = this.compareMonths(rifornimenti, now.getFullYear(), now.getMonth() + 1, 
                                                now.getFullYear(), now.getMonth());
        
        if (currentMonth && currentMonth.previous) {
            const spesaChange = currentMonth.changes.spesa;
            if (spesaChange) {
                if (Math.abs(spesaChange.percent) > 10) {
                    insights.push({
                        type: spesaChange.direction === 'up' ? 'warning' : 'success',
                        icon: spesaChange.direction === 'up' ? '⚠️' : '✅',
                        text: `Spesa questo mese: ${this.formatCurrency(currentMonth.current.spesaTotale)} (${spesaChange.percent > 0 ? '+' : ''}${spesaChange.percent.toFixed(1)}% vs mese scorso)`
                    });
                }
            }

            const consumoChange = currentMonth.changes.consumo;
            if (consumoChange && Math.abs(consumoChange.percent) > 3) {
                insights.push({
                    type: consumoChange.direction === 'down' ? 'success' : 'warning',
                    icon: consumoChange.direction === 'down' ? '🏆' : '📊',
                    text: `Consumo medio ${consumoChange.direction === 'down' ? 'migliorato' : 'peggiorato'}: ${this.formatNumber(currentMonth.current.consumoMedio)} L/100km (${consumoChange.percent > 0 ? '+' : ''}${consumoChange.percent.toFixed(1)}%)`
                });
            }
        }

        // Insight 2: Prezzo carburante
        if (rifornimenti.length >= 5) {
            const recenti = rifornimenti.slice(-3);
            const precedenti = rifornimenti.slice(-6, -3);
            
            const prezzoRecente = recenti.reduce((sum, r) => sum + r.prezzoLitro, 0) / recenti.length;
            const prezzoPrecedente = precedenti.reduce((sum, r) => sum + r.prezzoLitro, 0) / precedenti.length;
            
            const diffPrezzo = ((prezzoRecente - prezzoPrecedente) / prezzoPrecedente) * 100;
            
            if (Math.abs(diffPrezzo) > 3) {
                insights.push({
                    type: diffPrezzo > 0 ? 'warning' : 'success',
                    icon: diffPrezzo > 0 ? '📈' : '📉',
                    text: `Prezzo carburante ${diffPrezzo > 0 ? 'salito' : 'sceso'} a ${this.formatCurrency(prezzoRecente, 3)}/L (${diffPrezzo > 0 ? '+' : ''}${diffPrezzo.toFixed(1)}% recentemente)`
                });
            }
        }

        // Insight 3: Record consumo
        if (dashboard.consumo.consumoMigliore) {
            const analysis = this.calculateAnalysis(rifornimenti);
            const best = analysis.find(a => a.consumoL100km === dashboard.consumo.consumoMigliore);
            if (best) {
                const date = new Date(best.data);
                insights.push({
                    type: 'success',
                    icon: '🏆',
                    text: `Record personale: ${this.formatNumber(best.consumoL100km)} L/100km il ${date.getDate()}/${date.getMonth()+1} (${best.guida})`
                });
            }
        }

        // Insight 4: Prossimo rifornimento
        if (pieni.length >= 2) {
            const ultimoPieno = pieni[pieni.length - 1];
            const penultimoPieno = pieni[pieni.length - 2];
            const mediaKm = ultimoPieno.km - penultimoPieno.km;
            
            // Stima km rimanenti (assumo serbatoio 50L)
            const litriUltimoPieno = ultimoPieno.litri;
            const consumoMedio = dashboard.consumo.consumoMedio || 6;
            const kmStimati = Math.round((litriUltimoPieno * 100) / consumoMedio * 0.8); // 80% per sicurezza
            
            insights.push({
                type: 'info',
                icon: '⛽',
                text: `Con l'ultimo pieno (${litriUltimoPieno.toFixed(1)}L) puoi percorrere circa ${kmStimati}km prima del prossimo rifornimento`
            });
        }

        // Insight 5: Confronto tipo guida
        const consumoPerGuida = dashboard.consumoPerGuida;
        const tipiConDati = Object.entries(consumoPerGuida).filter(([_, v]) => v !== null);
        
        if (tipiConDati.length >= 2) {
            const sorted = tipiConDati.sort((a, b) => a[1] - b[1]);
            const migliore = sorted[0];
            const peggiore = sorted[sorted.length - 1];
            const diff = ((peggiore[1] - migliore[1]) / migliore[1]) * 100;
            
            if (diff > 10) {
                insights.push({
                    type: 'info',
                    icon: '🛣️',
                    text: `Guida in ${migliore[0]} consumi ${diff.toFixed(0)}% meno rispetto a ${peggiore[0]} (${this.formatNumber(migliore[1])} vs ${this.formatNumber(peggiore[1])} L/100km)`
                });
            }
        }

        return insights.length > 0 ? insights : [{
            type: 'info',
            icon: 'ℹ️',
            text: 'Continua ad aggiungere rifornimenti per ricevere insights più dettagliati!'
        }];
    }
};
