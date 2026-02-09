// ===== CHARTS MODULE =====
// Gestisce i grafici usando Chart.js

const Charts = {
    trendChart: null,
    consumoChart: null,
    monthlyTrendChart: null,

    // ===== GRAFICO TREND CONSUMO (Analisi) =====
    
    renderTrendChart(analysis) {
        const ctx = document.getElementById('trendChart');
        
        if (!ctx) return;

        // Distruggi grafico esistente
        if (this.trendChart) {
            this.trendChart.destroy();
        }

        if (analysis.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }

        // Prepara dati
        const labels = analysis.map(a => {
            const date = new Date(a.data);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });

        const consumoData = analysis.map(a => a.consumoL100km);
        const mediaMobileData = analysis.map(a => a.mediaMobile3);

        // Crea grafico
        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Consumo L/100km',
                        data: consumoData,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.3,
                        fill: true,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'Media Mobile (3)',
                        data: mediaMobileData,
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(2) + ' L/100km';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'L/100km'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Data'
                        }
                    }
                }
            }
        });
    },

    // ===== GRAFICO CONSUMO PER TIPO GUIDA (Dashboard) =====
    
    renderConsumoChart(consumoPerGuida) {
        const ctx = document.getElementById('consumoChart');
        
        if (!ctx) return;

        // Distruggi grafico esistente
        if (this.consumoChart) {
            this.consumoChart.destroy();
        }

        // Prepara dati
        const labels = [];
        const data = [];
        const colors = [];

        const tipiMap = {
            'città': { icon: '🏙️', color: '#ef4444' },
            'misto': { icon: '🔀', color: '#f59e0b' },
            'autostrada': { icon: '🛣️', color: '#10b981' }
        };

        Object.entries(consumoPerGuida).forEach(([tipo, valore]) => {
            if (valore !== null) {
                const info = tipiMap[tipo];
                labels.push(`${info.icon} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
                data.push(valore);
                colors.push(info.color);
            }
        });

        if (data.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }

        // Crea grafico
        this.consumoChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Consumo Medio L/100km',
                    data: data,
                    backgroundColor: colors.map(c => c + '80'), // Trasparenza
                    borderColor: colors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Consumo: ' + context.parsed.y.toFixed(2) + ' L/100km';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'L/100km'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        }
                    }
                }
            }
        });
    },

    // ===== GRAFICO TREND MENSILE (Mensile Tab) =====
    
    renderMonthlyTrendChart(rifornimenti) {
        const ctx = document.getElementById('monthlyTrendChart');
        
        if (!ctx) return;

        // Distruggi grafico esistente
        if (this.monthlyTrendChart) {
            this.monthlyTrendChart.destroy();
        }

        if (rifornimenti.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }

        // Ottieni dati mensili
        const monthlyData = Calculations.getMonthlyStats(rifornimenti);
        const months = Object.values(monthlyData).sort((a, b) => 
            new Date(a.year, a.month - 1) - new Date(b.year, b.month - 1)
        );

        // Prendi ultimi 6 mesi
        const last6Months = months.slice(-6);

        if (last6Months.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }

        // Prepara dati
        const labels = last6Months.map(m => {
            const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
            return `${monthNames[m.month - 1]} ${String(m.year).slice(-2)}`;
        });

        const spesaData = last6Months.map(m => m.spesaTotale);
        const consumoData = last6Months.map(m => m.consumoMedio);
        const kmData = last6Months.map(m => m.kmTotali);

        // Crea grafico
        this.monthlyTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Spesa (€)',
                        data: spesaData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        yAxisID: 'y',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Consumo (L/100km)',
                        data: consumoData,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        yAxisID: 'y1',
                        tension: 0.3,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    if (context.dataset.label.includes('Spesa')) {
                                        label += '€' + context.parsed.y.toFixed(2);
                                    } else if (context.dataset.label.includes('Consumo')) {
                                        label += context.parsed.y.toFixed(2) + ' L/100km';
                                    } else {
                                        label += context.parsed.y.toFixed(0) + ' km';
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Spesa (€)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Consumo (L/100km)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    },

    // Aggiorna tutti i grafici
    updateAll(rifornimenti, filterGuida = 'tutti') {
        const analysis = Calculations.calculateAnalysis(rifornimenti, filterGuida);
        const dashboard = Calculations.calculateDashboard(rifornimenti);

        this.renderTrendChart(analysis);
        this.renderConsumoChart(dashboard.consumoPerGuida);
    },

    // Pulisci tutti i grafici
    clearAll() {
        if (this.trendChart) {
            this.trendChart.destroy();
            this.trendChart = null;
        }
        if (this.consumoChart) {
            this.consumoChart.destroy();
            this.consumoChart = null;
        }
        if (this.monthlyTrendChart) {
            this.monthlyTrendChart.destroy();
            this.monthlyTrendChart = null;
        }
    }
};
