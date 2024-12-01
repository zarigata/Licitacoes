// Format number without cents
function formatNumber(number) {
    return Math.round(number).toString().replace('.', '');
}

// Parse formatted number back to float
function parseFormattedNumber(str) {
    if (!str) return 0;
    return parseInt(str.replace(/\D/g, ''));
}

// Format input while typing
function formatInput(input) {
    let value = input.value.replace(/\D/g, '');
    const number = parseInt(value);
    if (!isNaN(number)) {
        input.value = formatNumber(number);
    }
}

// Format percentage input (max 100%)
function formatPercentage(input) {
    let value = parseFormattedNumber(input.value);
    if (isNaN(value)) value = 0;
    if (value > 100) value = 100;
    input.value = formatNumber(value);
}

function addOneTimeExpense() {
    const container = document.createElement('div');
    container.className = 'expense-item';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'pip-boy-input';
    nameInput.placeholder = 'Expense Name';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'pip-boy-input';
    input.placeholder = '0';
    input.addEventListener('input', function() {
        formatInput(this);
        calculateTotals();
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'X';
    deleteBtn.onclick = () => {
        container.remove();
        calculateTotals();
    };
    
    container.appendChild(nameInput);
    container.appendChild(input);
    container.appendChild(deleteBtn);
    document.getElementById('oneTimeExpenses').appendChild(container);
}

function addMonthlyExpense() {
    const container = document.createElement('div');
    container.className = 'expense-item';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'pip-boy-input';
    nameInput.placeholder = 'Expense Name';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'pip-boy-input';
    input.placeholder = '0';
    input.addEventListener('input', function() {
        formatInput(this);
        calculateTotals();
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'X';
    deleteBtn.onclick = () => {
        container.remove();
        calculateTotals();
    };
    
    container.appendChild(nameInput);
    container.appendChild(input);
    container.appendChild(deleteBtn);
    document.getElementById('monthlyExpenses').appendChild(container);
}

function calculateOneTimeTotal() {
    let oneTimeTotal = 0;
    document.querySelectorAll('#oneTimeExpenses input').forEach((input, index) => {
        if (index % 2 === 1) { // Skip name inputs
            oneTimeTotal += parseFormattedNumber(input.value);
        }
    });
    return oneTimeTotal;
}

function calculateMonthlyTotal() {
    let monthlyTotal = 0;
    document.querySelectorAll('#monthlyExpenses input').forEach((input, index) => {
        if (index % 2 === 1) { // Skip name inputs
            monthlyTotal += parseFormattedNumber(input.value);
        }
    });
    return monthlyTotal;
}

function calculateAvailableBudget() {
    const maxPrice = parseFormattedNumber(document.getElementById('maxPrice').value);
    const taxRate = parseFormattedNumber(document.getElementById('taxRate').value) / 100;
    const minViablePercentage = parseFormattedNumber(document.getElementById('minViablePercentage').value) / 100;
    
    // First remove tax and minimum viable percentage from max price
    return maxPrice / ((1 + taxRate) * (1 + minViablePercentage));
}

function calculateTotalExpenses() {
    const oneTimeTotal = calculateOneTimeTotal();
    const monthlyTotal = calculateMonthlyTotal();
    const months = parseInt(document.getElementById('months').value) || 1;
    return oneTimeTotal + monthlyTotal * months;
}

function calculateMinViablePrice() {
    const totalExpenses = calculateTotalExpenses();
    const minViablePercentage = parseFormattedNumber(document.getElementById('minViablePercentage').value) / 100;
    const taxRate = parseFormattedNumber(document.getElementById('taxRate').value) / 100;
    return totalExpenses * (1 + minViablePercentage) * (1 + taxRate);
}

function calculateTotals() {
    const maxPriceInput = document.getElementById('maxPrice');
    formatInput(maxPriceInput);
    const maxPrice = parseFormattedNumber(maxPriceInput.value);
    const months = parseInt(document.getElementById('months').value) || 1;
    
    // Format percentage inputs
    const minViablePercentageInput = document.getElementById('minViablePercentage');
    const taxRateInput = document.getElementById('taxRate');
    formatPercentage(minViablePercentageInput);
    formatPercentage(taxRateInput);
    
    // Get percentage values
    const minViablePercentage = parseFormattedNumber(minViablePercentageInput.value) / 100;
    const taxRate = parseFormattedNumber(taxRateInput.value) / 100;
    
    // Calculate available budget after tax and min viable deductions
    const availableBudget = calculateAvailableBudget();
    
    // Calculate expenses
    const oneTimeTotal = calculateOneTimeTotal();
    const monthlyTotal = calculateMonthlyTotal();
    const totalMonthly = monthlyTotal * months;
    const totalExpenses = oneTimeTotal + totalMonthly;
    
    // Calculate minimum viable price (going up from expenses)
    const minViablePrice = calculateMinViablePrice();
    
    // Calculate remaining from available budget
    const remaining = availableBudget - totalExpenses;
    
    // Update display with formatted numbers
    document.getElementById('totalOneTime').textContent = formatNumber(oneTimeTotal) + ' CAPS';
    document.getElementById('totalMonthly').textContent = formatNumber(totalMonthly) + ' CAPS';
    document.getElementById('finalTotal').textContent = formatNumber(totalExpenses) + ' CAPS';
    document.getElementById('availableBudget').textContent = formatNumber(availableBudget) + ' CAPS';
    document.getElementById('minViablePrice').textContent = formatNumber(minViablePrice) + ' CAPS';
    document.getElementById('remainingBudget').textContent = formatNumber(remaining) + ' CAPS';
    
    // Add visual feedback for remaining budget
    const remainingElement = document.getElementById('remainingBudget');
    if (remaining < 0) {
        remainingElement.style.color = '#ff4444';
    } else {
        remainingElement.style.color = 'var(--pip-boy-green)';
    }
    
    updateStatistics();
}

// Initialize charts
let expenseChart = null;
let profitChart = null;

// Get all expense names and values
function getExpenseDetails() {
    const expenses = {
        oneTime: [],
        monthly: []
    };

    // Get one-time expenses
    document.querySelectorAll('#oneTimeExpenses .expense-item').forEach(item => {
        const nameInput = item.querySelector('input[placeholder="Expense Name"]');
        const valueInput = item.querySelector('input[placeholder="0"]');
        if (nameInput && valueInput && nameInput.value && valueInput.value) {
            expenses.oneTime.push({
                name: nameInput.value,
                value: parseFormattedNumber(valueInput.value)
            });
        }
    });

    // Get monthly expenses
    document.querySelectorAll('#monthlyExpenses .expense-item').forEach(item => {
        const nameInput = item.querySelector('input[placeholder="Expense Name"]');
        const valueInput = item.querySelector('input[placeholder="0"]');
        if (nameInput && valueInput && nameInput.value && valueInput.value) {
            const months = parseInt(document.getElementById('months').value) || 1;
            expenses.monthly.push({
                name: nameInput.value,
                value: parseFormattedNumber(valueInput.value) * months
            });
        }
    });

    return expenses;
}

function initializeCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0
        },
        plugins: {
            legend: {
                display: true,
                position: 'right',
                labels: {
                    color: '#2ec27e',
                    font: {
                        family: "'Share Tech Mono', monospace",
                        size: 10
                    },
                    boxWidth: 15
                }
            }
        }
    };

    // Expense Breakdown Chart
    const expenseCtx = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(expenseCtx, {
        type: 'doughnut',
        data: {
            labels: ['Initial Expense'],
            datasets: [{
                data: [1],
                backgroundColor: ['#2ec27e']
            }]
        },
        options: {
            ...chartOptions,
            cutout: '60%',
            layout: {
                padding: 10
            }
        }
    });

    // Profit Analysis Chart
    const profitCtx = document.getElementById('profitChart').getContext('2d');
    profitChart = new Chart(profitCtx, {
        type: 'bar',
        data: {
            labels: ['Person 1 (40%)', 'Person 2 (30%)', 'Person 3 (30%)'],
            datasets: [{
                label: 'Profit Share',
                data: [1, 1, 1],
                backgroundColor: ['#2ec27e', '#1a7f4f', '#0d4027']
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 1000,
                    ticks: { 
                        color: '#2ec27e',
                        callback: function(value) {
                            return formatNumber(value) + ' CAPS';
                        }
                    },
                    grid: { 
                        color: 'rgba(46, 194, 126, 0.1)'
                    }
                },
                x: {
                    ticks: { 
                        color: '#2ec27e',
                        font: {
                            size: 10
                        }
                    },
                    grid: { 
                        color: 'rgba(46, 194, 126, 0.1)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${formatNumber(value)} CAPS (${percentage}% of profit)`;
                        }
                    }
                }
            }
        }
    });
}

function updateStatistics() {
    const maxPrice = parseFormattedNumber(document.getElementById('maxPrice').value);
    const totalExpenses = calculateTotalExpenses();
    const minViablePrice = calculateMinViablePrice();
    const profit = Math.max(0, maxPrice - minViablePrice);

    // Update profit distribution
    const p1 = Math.max(1, profit * 0.4);
    const p2 = Math.max(1, profit * 0.3);
    const remainingProfit = Math.max(1, profit * 0.3);

    document.getElementById('p1Profit').textContent = formatNumber(p1) + ' CAPS';
    document.getElementById('p2Profit').textContent = formatNumber(p2) + ' CAPS';
    document.getElementById('remainingProfit').textContent = formatNumber(remainingProfit) + ' CAPS';

    // Update key metrics
    const profitMargin = maxPrice > 0 ? (profit / maxPrice) * 100 : 0;
    document.getElementById('profitMargin').textContent = Math.round(profitMargin) + '%';

    const monthlyTotal = calculateMonthlyTotal();
    const monthlyRatio = totalExpenses > 0 ? (monthlyTotal / totalExpenses) * 100 : 0;
    document.getElementById('monthlyRatio').textContent = Math.round(monthlyRatio) + '%';

    const breakEvenMonths = monthlyTotal > 0 ? Math.ceil(calculateOneTimeTotal() / monthlyTotal) : 0;
    document.getElementById('breakEvenMonths').textContent = breakEvenMonths;

    // Update charts with fresh data
    if (expenseChart && profitChart) {
        // Get detailed expense breakdown
        const expenses = getExpenseDetails();
        const allExpenses = [
            ...expenses.oneTime.map(exp => ({ ...exp, name: exp.name + ' (One-time)' })),
            ...expenses.monthly.map(exp => ({ ...exp, name: exp.name + ' (Monthly)' }))
        ].filter(exp => exp.value > 0);

        if (allExpenses.length > 0) {
            // Update expense breakdown chart
            expenseChart.data.labels = allExpenses.map(exp => exp.name);
            expenseChart.data.datasets[0].data = allExpenses.map(exp => exp.value);
            expenseChart.data.datasets[0].backgroundColor = allExpenses.map((_, i) => {
                const baseColor = '#2ec27e';
                const shade = 1 - (i * 0.15); // Darken for each item
                return adjustColor(baseColor, shade);
            });
        } else {
            expenseChart.data.labels = ['No Expenses'];
            expenseChart.data.datasets[0].data = [1];
            expenseChart.data.datasets[0].backgroundColor = ['#2ec27e'];
        }
        expenseChart.update('none');

        // Update profit analysis chart
        profitChart.data.datasets[0].data = [p1, p2, remainingProfit];
        const maxValue = Math.max(p1, p2, remainingProfit);
        profitChart.options.scales.y.suggestedMax = Math.ceil(maxValue * 1.2);
        profitChart.update('none');
    }
}

// Helper function to adjust color brightness
function adjustColor(color, factor) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
}

// Add event listeners
const maxPriceInput = document.getElementById('maxPrice');
maxPriceInput.addEventListener('input', function() {
    formatInput(this);
    calculateTotals();
});

document.getElementById('months').addEventListener('input', calculateTotals);
document.getElementById('minViablePercentage').addEventListener('input', calculateTotals);
document.getElementById('taxRate').addEventListener('input', calculateTotals);

// Add initial expense fields
addOneTimeExpense();
addMonthlyExpense();

// Add boot-up animation effect
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    const pipBoyScreen = document.querySelector('.pip-boy-screen');
    pipBoyScreen.style.opacity = '0';
    
    setTimeout(() => {
        pipBoyScreen.style.transition = 'opacity 1s ease-in';
        pipBoyScreen.style.opacity = '1';
        
        // Add typewriter effect to the header
        const header = document.querySelector('h1');
        const text = header.textContent;
        header.textContent = '';
        let i = 0;
        
        function typeWriter() {
            if (i < text.length) {
                header.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        }
        
        setTimeout(typeWriter, 500);
    }, 100);
});

// Chat and Settings functionality
let currentSettings = {
    ollamaIp: '192.168.15.115',
    selectedModel: ''
};

// Initialize settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('ollamaSettings');
    if (savedSettings) {
        currentSettings = JSON.parse(savedSettings);
        document.getElementById('ollamaIp').value = currentSettings.ollamaIp;
    }
}

// Save settings to localStorage
function saveSettings() {
    currentSettings.ollamaIp = document.getElementById('ollamaIp').value;
    currentSettings.selectedModel = document.getElementById('modelSelect').value;
    localStorage.setItem('ollamaSettings', JSON.stringify(currentSettings));
    modal.style.display = 'none';
    addMessageToChat('system', `SYSTEM: Connected to ${currentSettings.selectedModel} model`);
    fetchModels(); // Refresh models list with new IP
}

// Fetch available models from Ollama
async function fetchModels() {
    try {
        const response = await fetch(`http://${currentSettings.ollamaIp}:11434/api/tags`);
        const data = await response.json();
        const modelSelect = document.getElementById('modelSelect');
        modelSelect.innerHTML = '';
        
        data.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
        
        if (currentSettings.selectedModel) {
            modelSelect.value = currentSettings.selectedModel;
        }
    } catch (error) {
        console.error('Error fetching models:', error);
        const modelSelect = document.getElementById('modelSelect');
        modelSelect.innerHTML = '<option value="">Error loading models</option>';
    }
}

// Chat functionality
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    // Check if model is selected
    if (!currentSettings.selectedModel) {
        addMessageToChat('system', 'ERROR: Please select a model in settings first (click the cog icon)');
        return;
    }

    // Add user message to chat
    addMessageToChat('user', message);
    input.value = '';

    // Show loading indicator
    const loadingMessage = addMessageToChat('system', 'RobCo AI Processing...');

    try {
        const response = await fetch(`http://${currentSettings.ollamaIp}:11434/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: currentSettings.selectedModel,
                prompt: message,
                stream: false
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Remove loading message
        loadingMessage.remove();
        addMessageToChat('ai', data.response);
    } catch (error) {
        console.error('Error sending message:', error);
        // Remove loading message
        loadingMessage.remove();
        addMessageToChat('system', `ERROR: ${error.message || 'Unable to connect to RobCo AI system'}`);
    }
}

function addMessageToChat(type, content) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    
    // Format the content if it's a string
    if (typeof content === 'string') {
        content = content.replace(/\n/g, '<br>');
    }
    
    messageDiv.innerHTML = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Modal functionality
const modal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeBtn = document.getElementById('closeSettings');
const saveBtn = document.getElementById('saveSettings');

settingsBtn.onclick = () => {
    modal.style.display = 'block';
    fetchModels();
};

closeBtn.onclick = () => {
    modal.style.display = 'none';
};

saveBtn.onclick = saveSettings;

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Chat input handlers
document.getElementById('sendMessage').onclick = sendMessage;
document.getElementById('chatInput').onkeypress = (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
};

// Initialize
loadSettings();
fetchModels();

function calculateOneTimeTotal() {
    let oneTimeTotal = 0;
    document.querySelectorAll('#oneTimeExpenses input').forEach((input, index) => {
        if (index % 2 === 1) { // Skip name inputs
            oneTimeTotal += parseFormattedNumber(input.value);
        }
    });
    return oneTimeTotal;
}

function calculateMonthlyTotal() {
    let monthlyTotal = 0;
    document.querySelectorAll('#monthlyExpenses input').forEach((input, index) => {
        if (index % 2 === 1) { // Skip name inputs
            monthlyTotal += parseFormattedNumber(input.value);
        }
    });
    return monthlyTotal;
}

function calculateTotalExpenses() {
    const oneTimeTotal = calculateOneTimeTotal();
    const monthlyTotal = calculateMonthlyTotal();
    const months = parseInt(document.getElementById('months').value) || 1;
    return oneTimeTotal + monthlyTotal * months;
}

function calculateMinViablePrice() {
    const totalExpenses = calculateTotalExpenses();
    const minViablePercentage = parseFormattedNumber(document.getElementById('minViablePercentage').value) / 100;
    const taxRate = parseFormattedNumber(document.getElementById('taxRate').value) / 100;
    return totalExpenses * (1 + minViablePercentage) * (1 + taxRate);
}

// File upload and document analysis
document.getElementById('pdfUpload').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Show loading state
            document.getElementById('documentInfo').style.display = 'block';
            setDocumentInfo('Loading...', 'Loading...', 'Loading...', 'Loading...');

            const response = await fetch('/analyze_document', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            // Update the document info section
            document.getElementById('documentInfo').style.display = 'block';
            setDocumentInfo(
                data.preco?.response || 'Não encontrado',
                data.prova_conceito?.response || 'Não encontrado',
                data.capital_social?.response || 'Não encontrado',
                data.atestado?.response || 'Não encontrado'
            );

            // If max price was found, automatically set it in the calculator
            if (data.preco?.response) {
                const priceMatch = data.preco.response.match(/R\$\s*([\d,.]+)/);
                if (priceMatch) {
                    const price = priceMatch[1].replace(/\./g, '').replace(',', '');
                    document.getElementById('maxPrice').value = price;
                    calculateTotals();
                }
            }

            // Add success message to chat
            addMessageToChat('system', 'Document analyzed successfully! Check the extracted information above.');

        } catch (error) {
            console.error('Error:', error);
            setDocumentInfo('Error', 'Error', 'Error', 'Error');
            addMessageToChat('system', 'Error analyzing document: ' + error.message);
        }
    } else {
        addMessageToChat('system', 'Please upload a PDF file.');
    }
});

function setDocumentInfo(price, poc, capital, technical) {
    document.getElementById('maxPriceExtracted').textContent = price;
    document.getElementById('proofOfConcept').textContent = poc;
    document.getElementById('minCapital').textContent = capital;
    document.getElementById('technicalProof').textContent = technical;
}
