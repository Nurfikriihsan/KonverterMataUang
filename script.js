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

// API Config dari config.js (lokal, di-ignore Git)
const API_KEY = CONFIG?.API_KEY || "";
const API_URL = CONFIG?.API_URL || "";

// Data rates
let rateChart = null;
let ratesData = {};
let lastUpdated = null;

// Inisialisasi Aplikasi
function initApp() {
    populateCurrencyDropdowns();
    displayPopularCurrencies();
    fromCurrencySelect.value = 'USD';
    toCurrencySelect.value = 'IDR';
    fetchLatestRates();
    convertBtn.addEventListener('click', convertCurrency);
    switchBtn.addEventListener('click', switchCurrencies);
    popularCurrenciesContainer.addEventListener('click', handlePopularCurrencyClick);
}

// Dropdown mata uang
function populateCurrencyDropdowns() {
    const sortedCurrencies = Object.entries(currencies).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [code, name] of sortedCurrencies) {
        fromCurrencySelect.appendChild(createCurrencyOption(code, name));
        toCurrencySelect.appendChild(createCurrencyOption(code, name));
    }
}

function createCurrencyOption(code, name) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${code} - ${name}`;
    return option;
}

// Mata uang populer
function displayPopularCurrencies() {
    popularCurrenciesContainer.innerHTML = '';
    for (const currency of popularCurrencies) {
        const currencyCard = document.createElement('div');
        currencyCard.className = 'currency-card';
        currencyCard.dataset.currency = currency.code;
        currencyCard.innerHTML = `<div class="currency-code">${currency.code}</div>
                                  <div class="currency-name">${currency.name}</div>`;
        popularCurrenciesContainer.appendChild(currencyCard);
    }
}

function handlePopularCurrencyClick(event) {
    const card = event.target.closest('.currency-card');
    if (!card) return;
    toCurrencySelect.value = card.dataset.currency;
    convertCurrency();
}

// Fetch rates terbaru
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
        } else {
            throw new Error('Gagal ambil data rates');
        }
    } catch (error) {
        showError();
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Konversi
function convertCurrency() {
    const amount = parseFloat(amountInput.value);
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;

    if (isNaN(amount) || amount <= 0) {
        alert('Masukkan jumlah yang valid');
        return;
    }

    if (!Object.keys(ratesData).length) {
        fetchLatestRates().then(() => {
            if (Object.keys(ratesData).length) {
                performConversion(amount, fromCurrency, toCurrency);
            }
        });
    } else {
        performConversion(amount, fromCurrency, toCurrency);
    }

    fetchHistoricalRates(fromCurrency, toCurrency);
}

function performConversion(amount, fromCurrency, toCurrency) {
    const fromRate = fromCurrency === 'USD' ? 1 : ratesData[fromCurrency];
    const toRate = ratesData[toCurrency];
    const amountInUSD = amount / fromRate;
    const convertedAmount = amountInUSD * toRate;

    resultText.textContent = `${amount} ${fromCurrency} =`;
    resultAmountElement.textContent = `${convertedAmount.toLocaleString('id-ID', { maximumFractionDigits: 2 })} ${toCurrency}`;
    rateInfoElement.textContent = `1 ${fromCurrency} = ${(toRate / fromRate).toLocaleString('id-ID', { maximumFractionDigits: 6 })} ${toCurrency}`;
}

// Tukar mata uang
function switchCurrencies() {
    [fromCurrencySelect.value, toCurrencySelect.value] = [toCurrencySelect.value, fromCurrencySelect.value];
    convertCurrency();
}

// Data historis (dummy)
async function fetchHistoricalRates(fromCurrency, toCurrency) {
    showLoading(true);
    try {
        const historicalData = simulateHistoricalData(fromCurrency, toCurrency);
        displayChart(historicalData);
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}

function simulateHistoricalData(fromCurrency, toCurrency) {
    const currentRate = fromCurrency === 'USD' ? ratesData[toCurrency] : (ratesData[toCurrency] / ratesData[fromCurrency]);
    const dates = [];
    const rates = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('id-ID'));
        const fluctuation = (Math.random() * 0.06) - 0.03;
        rates.push(currentRate * (1 + fluctuation));
    }
    return { dates, rates };
}

// Chart
function displayChart(data) {
    const ctx = document.createElement('canvas');
    ctx.id = 'rate-chart';
    chartContainer.innerHTML = '';
    chartContainer.appendChild(ctx);
    chartContainer.style.display = 'block';

    if (rateChart) rateChart.destroy();

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
            maintainAspectRatio: false
        }
    });
}

// UI helpers
function showLoading(show = true) {
    loadingElement.style.display = show ? 'block' : 'none';
}
function hideLoading() {
    loadingElement.style.display = 'none';
}
function showError() {
    errorMessage.style.display = 'block';
}
function hideError() {
    errorMessage.style.display = 'none';
}
function updateLastUpdatedTime() {
    if (lastUpdated) {
        lastUpdatedElement.textContent = `Terakhir diperbarui: ${lastUpdated.toLocaleString('id-ID')}`;
    }
}

// Init
document.addEventListener('DOMContentLoaded', initApp);
