// ===== MAIN APP =====
// Coordina UI, eventi, e moduli

const App = {
    currentTab: 'rifornimenti',
    filterGuida: 'tutti',
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,

    // ===== INIZIALIZZAZIONE =====
    
    init() {
        this.setupEventListeners();
        this.loadData();
        this.switchTab('rifornimenti');
    },

    // ===== EVENT LISTENERS =====
    
    setupEventListeners() {
        // Bottom Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Header Actions
        document.getElementById('exportBtn').addEventListener('click', () => {
            Storage.exportCSV();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileImport(e.target.files[0]);
        });

        // Rifornimenti Tab
        document.getElementById('addRefuelBtn').addEventListener('click', () => {
            this.showRefuelForm();
        });

        document.getElementById('cancelFormBtn').addEventListener('click', () => {
            this.hideRefuelForm();
        });

        document.getElementById('refuelFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRefuel();
        });

        // Auto-calcola spesa quando cambiano litri o prezzo
        document.getElementById('inputLitri').addEventListener('input', () => this.updateSpesa());
        document.getElementById('inputPrezzo').addEventListener('input', () => this.updateSpesa());

        // Filtro Analisi
        document.getElementById('filterGuida').addEventListener('change', (e) => {
            this.filterGuida = e.target.value;
            this.renderAnalysis();
            Charts.updateAll(Storage.load(), this.filterGuida);
        });

        // Mensile Tab
        document.getElementById('prevMonthBtn').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('nextMonthBtn').addEventListener('click', () => {
            this.changeMonth(1);
        });
    },

    // ===== NAVIGATION =====
    
    switchTab(tab) {
        this.currentTab = tab;

        // Update UI
        document.querySelectorAll('.tab-content').forEach(el => {
            el.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Render tab content
        if (tab === 'rifornimenti') {
            this.renderRefuelList();
        } else if (tab === 'analisi') {
            this.renderAnalysis();
            Charts.updateAll(Storage.load(), this.filterGuida);
        } else if (tab === 'mensile') {
            this.renderMensile();
            Charts.renderMonthlyTrendChart(Storage.load());
        } else if (tab === 'dashboard') {
            this.renderDashboard();
            this.renderInsights();
            Charts.updateAll(Storage.load());
        }
    },

    // ===== RIFORNIMENTI TAB =====
    
    showRefuelForm() {
        document.getElementById('refuelForm').classList.remove('hidden');
        
        // Set data odierna
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('inputData').value = today;
        
        // Scroll to form
        document.getElementById('refuelForm').scrollIntoView({ behavior: 'smooth' });
    },

    hideRefuelForm() {
        document.getElementById('refuelForm').classList.add('hidden');
        this.clearForm();
    },

    clearForm() {
        document.getElementById('refuelFormElement').reset();
        document.getElementById('displaySpesa').value = '';
    },

    updateSpesa() {
        const litri = parseFloat(document.getElementById('inputLitri').value) || 0;
        const prezzo = parseFloat(document.getElementById('inputPrezzo').value) || 0;
        const spesa = litri * prezzo;
        
        document.getElementById('displaySpesa').value = spesa > 0 
            ? `€${spesa.toFixed(2)}` 
            : '';
    },

    saveRefuel() {
        const rifornimento = {
            data: document.getElementById('inputData').value,
            km: parseInt(document.getElementById('inputKm').value),
            litri: parseFloat(document.getElementById('inputLitri').value),
            prezzoLitro: parseFloat(document.getElementById('inputPrezzo').value),
            spesa: parseFloat(document.getElementById('inputLitri').value) * 
                   parseFloat(document.getElementById('inputPrezzo').value),
            tipo: document.querySelector('input[name="tipo"]:checked').value,
            guida: document.getElementById('inputGuida').value,
            note: document.getElementById('inputNote').value
        };

        // VALIDAZIONE
        const validation = this.validateRefuel(rifornimento);
        
        if (!validation.valid) {
            // Errore bloccante
            alert('❌ ' + validation.error);
            return;
        }

        if (validation.warnings.length > 0) {
            // Warnings non bloccanti - chiedi conferma
            const warningMsg = '⚠️ Attenzione:\n\n' + validation.warnings.join('\n\n') + '\n\nVuoi salvare comunque?';
            if (!confirm(warningMsg)) {
                return;
            }
        }

        Storage.add(rifornimento);
        this.hideRefuelForm();
        this.renderRefuelList();
        
        // Mostra messaggio
        alert('✅ Rifornimento salvato!');
    },

    // ===== VALIDAZIONE RIFORNIMENTO =====
    
    validateRefuel(rifornimento) {
        const result = {
            valid: true,
            error: null,
            warnings: []
        };

        const rifornimenti = Storage.load();
        
        // VALIDAZIONE 1: Km retroattivi (ERRORE BLOCCANTE)
        if (rifornimenti.length > 0) {
            const sorted = [...rifornimenti].sort((a, b) => new Date(b.data) - new Date(a.data));
            const ultimoKm = sorted[0].km;
            
            if (rifornimento.km < ultimoKm) {
                result.valid = false;
                result.error = `I km inseriti (${rifornimento.km.toLocaleString()}) sono minori dell'ultimo rifornimento (${ultimoKm.toLocaleString()}).\n\nControlla il valore!`;
                return result;
            }

            // VALIDAZIONE 2: Data futura (WARNING)
            const oggi = new Date();
            oggi.setHours(0, 0, 0, 0);
            const dataRif = new Date(rifornimento.data);
            
            if (dataRif > oggi) {
                result.warnings.push('📅 La data inserita è nel futuro. È corretto?');
            }

            // VALIDAZIONE 3: Consumo anomalo (WARNING) - solo se pieno
            if (rifornimento.tipo === 'pieno' && rifornimenti.length > 0) {
                const ultimoPieno = this.getUltimoPieno(rifornimenti);
                
                if (ultimoPieno) {
                    const kmPercorsi = rifornimento.km - ultimoPieno.km;
                    const consumoPrevisto = (rifornimento.litri * 100) / kmPercorsi;
                    
                    // Consumo anomalo se > 10 L/100km o < 3 L/100km
                    if (consumoPrevisto > 10) {
                        result.warnings.push(`⛽ Consumo molto alto: ${consumoPrevisto.toFixed(2)} L/100km\n(Hai percorso ${kmPercorsi}km con ${rifornimento.litri}L)`);
                    } else if (consumoPrevisto < 3 && kmPercorsi > 100) {
                        result.warnings.push(`⛽ Consumo molto basso: ${consumoPrevisto.toFixed(2)} L/100km\n(Sembra irrealistico, controlla i dati)`);
                    }
                }
            }
        }

        // VALIDAZIONE 4: Litri eccessivi (WARNING)
        if (rifornimento.litri > 70) {
            result.warnings.push(`⛽ Litri molto alti: ${rifornimento.litri}L\n(Capacità serbatoio superata?)`);
        }

        // VALIDAZIONE 5: Prezzo anomalo (WARNING)
        if (rifornimenti.length >= 3) {
            const recenti = rifornimenti.slice(-3);
            const prezzoMedio = recenti.reduce((sum, r) => sum + r.prezzoLitro, 0) / recenti.length;
            const diffPercent = ((rifornimento.prezzoLitro - prezzoMedio) / prezzoMedio) * 100;
            
            if (Math.abs(diffPercent) > 15) {
                result.warnings.push(`💶 Prezzo ${diffPercent > 0 ? 'molto alto' : 'molto basso'}: €${rifornimento.prezzoLitro.toFixed(3)}/L\n(Tua media recente: €${prezzoMedio.toFixed(3)}/L, ${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(0)}%)`);
            }
        }

        return result;
    },

    getUltimoPieno(rifornimenti) {
        const pieni = rifornimenti.filter(r => r.tipo === 'pieno')
                                  .sort((a, b) => new Date(b.data) - new Date(a.data));
        return pieni.length > 0 ? pieni[0] : null;
    },

    deleteRefuel(id) {
        if (confirm('Sei sicuro di voler eliminare questo rifornimento?')) {
            Storage.delete(id);
            this.renderRefuelList();
        }
    },

    renderRefuelList() {
        const container = document.getElementById('refuelList');
        const rifornimenti = Storage.load();

        if (rifornimenti.length === 0) {
            container.innerHTML = '<p class="empty-state">Nessun rifornimento. Clicca "➕ Nuovo" per iniziare.</p>';
            return;
        }

        // Ordina per data (più recente prima)
        const sorted = [...rifornimenti].sort((a, b) => 
            new Date(b.data) - new Date(a.data)
        );

        let html = '';
        sorted.forEach(r => {
            const date = new Date(r.data);
            const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            
            const tipoIcon = r.tipo === 'pieno' ? '⚫' : '◯';
            const guidaIcon = {
                'città': '🏙️',
                'misto': '🔀',
                'autostrada': '🛣️'
            }[r.guida] || '🚗';

            html += `
                <div class="refuel-item ${r.tipo}">
                    <div class="refuel-header">
                        <span class="refuel-date">${dateStr}</span>
                        <span class="refuel-type ${r.tipo}">${tipoIcon} ${r.tipo}</span>
                    </div>
                    <div class="refuel-details">
                        <div class="detail-item">
                            <span class="detail-label">Km Totali</span>
                            <span class="detail-value">${r.km.toLocaleString('it-IT')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Litri</span>
                            <span class="detail-value">${r.litri.toFixed(2)} L</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Prezzo/L</span>
                            <span class="detail-value">€${r.prezzoLitro.toFixed(3)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Spesa</span>
                            <span class="detail-value">€${r.spesa.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="refuel-footer">
                        <span class="refuel-guida">${guidaIcon} ${r.guida}</span>
                        <div class="refuel-actions">
                            <button class="btn-delete" onclick="App.deleteRefuel('${r.id}')">🗑️</button>
                        </div>
                    </div>
                    ${r.note ? `<div style="margin-top:0.5rem;font-size:0.875rem;color:var(--text-secondary);">📝 ${r.note}</div>` : ''}
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // ===== ANALISI TAB =====
    
    renderAnalysis() {
        const container = document.getElementById('analysisList');
        const rifornimenti = Storage.load();
        const analysis = Calculations.calculateAnalysis(rifornimenti, this.filterGuida);

        if (analysis.length === 0) {
            container.innerHTML = '<p class="empty-state">Servono almeno 2 rifornimenti PIENI per l\'analisi.</p>';
            return;
        }

        // Calcola media per valutazione
        const consumi = analysis.map(a => a.consumoL100km);
        const media = consumi.reduce((a, b) => a + b, 0) / consumi.length;

        let html = '';
        analysis.forEach((a, index) => {
            const date = new Date(a.data);
            const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
            
            const evaluation = Calculations.evaluateConsumption(a.consumoL100km, media);
            const consumoClass = evaluation === 'good' ? 'good' : evaluation === 'bad' ? 'bad' : '';

            const guidaIcon = {
                'città': '🏙️',
                'misto': '🔀',
                'autostrada': '🛣️'
            }[a.guida] || '🚗';

            html += `
                <div class="analysis-item">
                    <div class="analysis-header">
                        <div class="analysis-number">${a.numero}</div>
                        <div style="text-align:right;">
                            <strong>${dateStr}</strong><br>
                            <small style="color:var(--text-secondary);">${guidaIcon} ${a.guida}</small>
                        </div>
                    </div>
                    <div class="analysis-stats">
                        <div class="analysis-stat">
                            <span class="analysis-stat-label">Km Percorsi</span>
                            <span class="analysis-stat-value">${a.kmPercorsi}</span>
                        </div>
                        <div class="analysis-stat">
                            <span class="analysis-stat-label">Litri</span>
                            <span class="analysis-stat-value">${a.litri.toFixed(1)}</span>
                        </div>
                        <div class="analysis-stat">
                            <span class="analysis-stat-label">Consumo</span>
                            <span class="analysis-stat-value ${consumoClass}">${a.consumoL100km.toFixed(2)}</span>
                        </div>
                        <div class="analysis-stat">
                            <span class="analysis-stat-label">Media Mobile</span>
                            <span class="analysis-stat-value">${a.mediaMobile3 ? a.mediaMobile3.toFixed(2) : '-'}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // ===== DASHBOARD TAB =====
    
    renderDashboard() {
        const rifornimenti = Storage.load();
        const stats = Calculations.calculateDashboard(rifornimenti);

        // Economici
        document.getElementById('statSpesaTotale').textContent = 
            Calculations.formatCurrency(stats.economici.spesaTotale);
        document.getElementById('statCostoKm').textContent = 
            Calculations.formatCurrency(stats.economici.costoKm, 3) + '/km';
        document.getElementById('statCosto100Km').textContent = 
            Calculations.formatCurrency(stats.economici.costo100Km);
        document.getElementById('statPrezzoMedio').textContent = 
            Calculations.formatCurrency(stats.economici.prezzoMedio, 3) + '/L';

        // Utilizzo
        document.getElementById('statKmTotali').textContent = 
            stats.utilizzo.kmTotali.toLocaleString('it-IT') + ' km';
        document.getElementById('statNumRifornimenti').textContent = 
            stats.utilizzo.totaleRifornimenti;
        document.getElementById('statLitriTotali').textContent = 
            Calculations.formatNumber(stats.utilizzo.litriTotali, 1) + ' L';

        // Consumo
        document.getElementById('statConsumoMedio').textContent = 
            stats.consumo.consumoMedio ? Calculations.formatNumber(stats.consumo.consumoMedio) + ' L/100km' : '-';
        document.getElementById('statConsumoMigliore').textContent = 
            stats.consumo.consumoMigliore ? Calculations.formatNumber(stats.consumo.consumoMigliore) + ' L/100km' : '-';
        document.getElementById('statConsumoPeggiore').textContent = 
            stats.consumo.consumoPeggiore ? Calculations.formatNumber(stats.consumo.consumoPeggiore) + ' L/100km' : '-';
    },

    // ===== MENSILE TAB =====
    
    changeMonth(direction) {
        this.currentMonth += direction;
        
        if (this.currentMonth > 12) {
            this.currentMonth = 1;
            this.currentYear++;
        } else if (this.currentMonth < 1) {
            this.currentMonth = 12;
            this.currentYear--;
        }
        
        this.renderMensile();
    },

    renderMensile() {
        const rifornimenti = Storage.load();
        
        // Aggiorna label mese
        const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                           'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        document.getElementById('currentMonth').textContent = 
            `${monthNames[this.currentMonth - 1]} ${this.currentYear}`;

        // Abilita/Disabilita bottoni navigazione
        const now = new Date();
        const isCurrentMonth = this.currentYear === now.getFullYear() && 
                              this.currentMonth === (now.getMonth() + 1);
        document.getElementById('nextMonthBtn').disabled = isCurrentMonth;

        // Ottieni statistiche mese corrente e precedente
        let prevMonth = this.currentMonth - 1;
        let prevYear = this.currentYear;
        if (prevMonth < 1) {
            prevMonth = 12;
            prevYear--;
        }

        const comparison = Calculations.compareMonths(
            rifornimenti, 
            this.currentYear, this.currentMonth,
            prevYear, prevMonth
        );

        // Render confronto
        this.renderMonthlyComparison(comparison);
        
        // Render dettagli mese
        this.renderMonthlyDetails(comparison ? comparison.current : null);
    },

    renderMonthlyComparison(comparison) {
        const container = document.getElementById('monthlyComparison');
        
        if (!comparison || !comparison.current) {
            container.innerHTML = '<p class="empty-state" style="grid-column: 1/-1;">Nessun dato per questo mese</p>';
            return;
        }

        const current = comparison.current;
        const changes = comparison.changes;

        let html = '';

        // Spesa
        html += this.renderComparisonItem(
            'Spesa Totale',
            Calculations.formatCurrency(current.spesaTotale),
            changes.spesa
        );

        // Consumo
        html += this.renderComparisonItem(
            'Consumo Medio',
            current.consumoMedio ? Calculations.formatNumber(current.consumoMedio) + ' L/100km' : '-',
            changes.consumo,
            true // inverti colori (meno è meglio)
        );

        // Prezzo
        html += this.renderComparisonItem(
            'Prezzo Medio',
            Calculations.formatCurrency(current.prezzoMedio, 3) + '/L',
            changes.prezzo
        );

        // Km
        html += this.renderComparisonItem(
            'Km Percorsi',
            current.kmTotali.toLocaleString('it-IT') + ' km',
            changes.km
        );

        container.innerHTML = html;
    },

    renderComparisonItem(label, value, change, invertColors = false) {
        let changeHtml = '';
        
        if (change && change.percent !== null) {
            const direction = change.direction;
            let cssClass = 'neutral';
            let arrow = '➡️';
            
            if (direction === 'up') {
                cssClass = invertColors ? 'negative' : 'positive';
                arrow = '↗️';
            } else if (direction === 'down') {
                cssClass = invertColors ? 'positive' : 'negative';
                arrow = '↘️';
            }
            
            changeHtml = `
                <span class="comparison-change ${cssClass}">
                    ${arrow} ${change.percent > 0 ? '+' : ''}${change.percent.toFixed(1)}%
                </span>
            `;
        } else {
            changeHtml = '<span class="comparison-change neutral">-</span>';
        }

        return `
            <div class="comparison-item">
                <span class="comparison-label">${label}</span>
                <span class="comparison-value">${value}</span>
                ${changeHtml}
            </div>
        `;
    },

    renderMonthlyDetails(monthData) {
        const container = document.getElementById('monthlyDetails');
        
        if (!monthData) {
            container.innerHTML = '<p class="empty-state" style="grid-column: 1/-1;">Nessun dato</p>';
            return;
        }

        container.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Rifornimenti</span>
                <span class="stat-value">${monthData.numRifornimenti}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Litri Totali</span>
                <span class="stat-value">${Calculations.formatNumber(monthData.litriTotali, 1)} L</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Km Percorsi</span>
                <span class="stat-value">${monthData.kmTotali.toLocaleString('it-IT')} km</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Spesa Totale</span>
                <span class="stat-value">${Calculations.formatCurrency(monthData.spesaTotale)}</span>
            </div>
        `;
    },

    // ===== INSIGHTS =====
    
    renderInsights() {
        const container = document.getElementById('insightsBox');
        const rifornimenti = Storage.load();
        
        const insights = Calculations.generateInsights(rifornimenti);
        
        if (insights.length === 0) {
            container.innerHTML = '<p class="empty-state">Nessun insight disponibile</p>';
            return;
        }

        let html = '';
        insights.forEach(insight => {
            html += `
                <div class="insight-item ${insight.type}">
                    <span class="insight-icon">${insight.icon}</span>
                    <span class="insight-text">${insight.text}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // ===== IMPORT/EXPORT =====
    
    async handleFileImport(file) {
        if (!file) return;

        try {
            const count = await Storage.importCSV(file);
            alert(`✅ Importati ${count} rifornimenti!`);
            this.loadData();
            this.switchTab('rifornimenti');
        } catch (error) {
            alert('❌ Errore importazione: ' + error.message);
        }

        // Reset input
        document.getElementById('fileInput').value = '';
    },

    // ===== DATA LOADING =====
    
    loadData() {
        this.renderRefuelList();
    }
};

// ===== START APP =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
