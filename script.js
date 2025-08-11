// Daftar mata uang dengan nama dalam Bahasa Indonesia
const currencies = {
    "IDR": "Rupiah Indonesia",
    "USD": "Dolar Amerika Serikat",
    "EUR": "Euro",
    "JPY": "Yen Jepang",
    "GBP": "Pound Sterling Inggris",
    "AUD": "Dolar Australia",
    "CAD": "Dolar Kanada",
    "CHF": "Franc Swiss",
    "CNY": "Yuan China",
    "HKD": "Dolar Hong Kong",
    "NZD": "Dolar Selandia Baru",
    "SGD": "Dolar Singapura",
    "KRW": "Won Korea Selatan",
    "MYR": "Ringgit Malaysia",
    "THB": "Baht Thailand",
    "BND": "Dolar Brunei",
    "PHP": "Peso Filipina",
    "TWD": "Dolar Taiwan",
    "SAR": "Riyal Arab Saudi",
    "AED": "Dirham Uni Emirat Arab"
};

// Daftar mata uang populer
const popularCurrencies = [
    { code: "USD", name: "Dolar AS" },
    { code: "EUR", name: "Euro" },
    { code: "JPY", name: "Yen Jepang" },
    { code: "GBP", name: "Pound Inggris" },
    { code: "AUD", name: "Dolar Australia" },
    { code: "SGD", name: "Dolar Singapura" },
    { code: "MYR", name: "Ringgit Malaysia" },
    { code: "CNY", name: "Yuan China" }
];

// Elemen DOM
const fromCurrencySelect = document.getElementById('from-currency');
const toCurrencySelect = document.getElementById('to-currency');
const amountInput = document.getElementById('amount');
const convertBtn = document.getElementById('convert-btn');
const switchBtn = document.getElementById('switch-currencies');
const resultElement = document.getElementById('result');
const resultAmountElement = document.getElementById('result-amount');
const resultText = document.getElementById('result-text');
const rateInfoElement = document.getElementById('rate-info');
const loadingElement = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const lastUpdatedElement = document.getElementById('last-updated');
const popularCurrenciesContainer = document.getElementById('popular-currencies');
const chartContainer = document.getElementById('chart-container');

// API Key Exchange Rate API
const API_KEY = '65ff2441c22c66879f7a13ee'; // Ganti dengan API key Anda

// URL API
const API_URL = 'https://v6.exchangerate-api.com/v6/';

// Variable untuk menyimpan chart
let rateChart = null;

// Variable untuk menyimpan data rates
let ratesData = {};
let lastUpdated = null;

// Inisialisasi Aplikasi
function initApp() {
    // Mengisi dropdown mata uang
    populateCurrencyDropdowns();

    // Mengisi mata uang populer
    displayPopularCurrencies();

    // Set default values
    fromCurrencySelect.value = 'USD';
    toCurrencySelect.value = 'IDR';

    // Ambil data rates terbaru
    fetchLatestRates();

    // Event Listeners
    convertBtn.addEventListener('click', convertCurrency);
    switchBtn.addEventListener('click', switchCurrencies);

    // Tambahkan event listener untuk mata uang populer
    popularCurrenciesContainer.addEventListener('click', handlePopularCurrencyClick);
}

// Fungsi untuk mengisi dropdown mata uang
function populateCurrencyDropdowns() {
    // Urutkan mata uang berdasarkan kode
    const sortedCurrencies = Object.entries(currencies).sort((a, b) => a[0].localeCompare(b[0]));

    // Buat opsi untuk setiap mata uang
    for (const [code, name] of sortedCurrencies) {
        const option1 = createCurrencyOption(code, name);
        const option2 = createCurrencyOption(code, name);

        fromCurrencySelect.appendChild(option1);
        toCurrencySelect.appendChild(option2);
    }
}

// Fungsi untuk membuat opsi mata uang
function createCurrencyOption(code, name) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${code} - ${name}`;
    return option;
}

// Fungsi untuk menampilkan mata uang populer
function displayPopularCurrencies() {
    popularCurrenciesContainer.innerHTML = '';

    for (const currency of popularCurrencies) {
        const currencyCard = document.createElement('div');
        currencyCard.className = 'currency-card';
        currencyCard.dataset.currency = currency.code;

        currencyCard.innerHTML = `
                    <div class="currency-code">${currency.code}</div>
                    <div class="currency-name">${currency.name}</div>
                `;

        popularCurrenciesContainer.appendChild(currencyCard);
    }
}

// Fungsi untuk menangani klik pada mata uang populer
function handlePopularCurrencyClick(event) {
    const currencyCard = event.target.closest('.currency-card');
    if (!currencyCard) return;

    const currencyCode = currencyCard.dataset.currency;
    toCurrencySelect.value = currencyCode;
    convertCurrency();
}

// Fungsi untuk mengambil data rates terbaru
async function fetchLatestRates() {
    showLoading(true);
    hideError();

    try {
        const response = await fetch(`${API_URL}${API_KEY}/latest/USD`);
        const data = await response.json();

        if (data.result === 'success') {
            ratesData = data.conversion_rates;
            lastUpdated = new Date();
            updateLastUpdatedTime();
            hideLoading();
        } else {
            throw new Error('Gagal mengambil data rates');
        }
    } catch (error) {
        console.error('Error:', error);
        showError();
        hideLoading();
    }
}

// Fungsi untuk mengkonversi mata uang
function convertCurrency() {
    const amount = parseFloat(amountInput.value);
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;

    if (isNaN(amount) || amount <= 0) {
        alert('Silakan masukkan jumlah yang valid');
        return;
    }

    if (Object.keys(ratesData).length === 0) {
        // Jika data rates belum tersedia, coba ambil lagi
        fetchLatestRates().then(() => {
            if (Object.keys(ratesData).length > 0) {
                performConversion(amount, fromCurrency, toCurrency);
            }
        });
    } else {
        performConversion(amount, fromCurrency, toCurrency);
    }

    // Ambil data historis untuk chart
    fetchHistoricalRates(fromCurrency, toCurrency);
}

// Fungsi untuk melakukan konversi
function performConversion(amount, fromCurrency, toCurrency) {
    // Hitung rate konversi (Relative to USD)
    // Jika mata uang asal adalah USD, maka rate nya 1
    const fromRate = fromCurrency === 'USD' ? 1 : ratesData[fromCurrency];
    const toRate = ratesData[toCurrency];

    // Hitung hasil konversi
    // 1. Konversi ke USD terlebih dahulu
    // 2. Kemudian konversi dari USD ke mata uang tujuan
    const amountInUSD = amount / fromRate;
    const convertedAmount = amountInUSD * toRate;

    // Tampilkan hasil
    resultText.textContent = `${amount} ${fromCurrency} =`;
    resultAmountElement.textContent = `${convertedAmount.toLocaleString('id-ID', { maximumFractionDigits: 2 })} ${toCurrency}`;

    // Tampilkan info rate
    const rate = toRate / fromRate;
    rateInfoElement.textContent = `1 ${fromCurrency} = ${rate.toLocaleString('id-ID', { maximumFractionDigits: 6 })} ${toCurrency}`;
}

// Fungsi untuk menukar mata uang
function switchCurrencies() {
    const temp = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = temp;

    // Konversi ulang
    convertCurrency();
}

// Fungsi untuk mengambil data historis
async function fetchHistoricalRates(fromCurrency, toCurrency) {
    showLoading(true);

    try {
        // Karena API gratis biasanya memiliki batasan, kita simulasikan data historis
        // Pada implementasi nyata, gunakan endpoint historical dari API
        const historicalData = simulateHistoricalData(fromCurrency, toCurrency);
        displayChart(historicalData);
    } catch (error) {
        console.error('Error fetching historical data:', error);
    } finally {
        hideLoading();
    }
}

// Fungsi untuk mensimulasikan data historis (untuk demo)
function simulateHistoricalData(fromCurrency, toCurrency) {
    const currentRate = fromCurrency === 'USD'
        ? ratesData[toCurrency]
        : (ratesData[toCurrency] / ratesData[fromCurrency]);

    // Buat data untuk 7 hari terakhir dengan fluktuasi acak
    const dates = [];
    const rates = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('id-ID'));

        // Buat fluktuasi acak antara -3% dan +3%
        const fluctuation = (Math.random() * 0.06) - 0.03;
        const historicalRate = currentRate * (1 + fluctuation);
        rates.push(historicalRate);
    }

    return { dates, rates };
}

// Fungsi untuk menampilkan chart
function displayChart(data) {
    const ctx = document.createElement('canvas');
    ctx.id = 'rate-chart';

    // Bersihkan container dan tambahkan canvas baru
    chartContainer.innerHTML = '';
    chartContainer.appendChild(ctx);
    chartContainer.style.display = 'block';

    // Buat chart baru
    if (rateChart) {
        rateChart.destroy();
    }

    rateChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: `${fromCurrencySelect.value} ke ${toCurrencySelect.value}`,
                data: data.rates,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
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
                        label: function (context) {
                            const value = context.raw;
                            return `Rate: ${value.toLocaleString('id-ID', { maximumFractionDigits: 6 })}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Fungsi untuk menampilkan loading
function showLoading(show = true) {
    loadingElement.style.display = show ? 'block' : 'none';
}

// Fungsi untuk menyembunyikan loading
function hideLoading() {
    loadingElement.style.display = 'none';
}

// Fungsi untuk menampilkan error
function showError() {
    errorMessage.style.display = 'block';
}

// Fungsi untuk menyembunyikan error
function hideError() {
    errorMessage.style.display = 'none';
}

// Fungsi untuk memperbarui waktu terakhir update
function updateLastUpdatedTime() {
    if (lastUpdated) {
        const formattedTime = lastUpdated.toLocaleString('id-ID');
        lastUpdatedElement.textContent = `Terakhir diperbarui: ${formattedTime}`;
    }
}

// Inisialisasi aplikasi saat dokumen telah dimuat
document.addEventListener('DOMContentLoaded', initApp);