const API_BASE_URL = 'http://localhost:8000/api/v1';

let threatChart = null;

window.addEventListener('DOMContentLoaded', () => {
    fetchMetrics();
    setupDragAndDrop();
    initChart();
});

function formatPercent(value) {
    if (!Number.isFinite(value)) {
        return '--%';
    }

    return `${value.toFixed(2)}%`;
}

function updateMetric(id, value) {
    const element = document.getElementById(id);
    if (!element) {
        return;
    }

    element.innerText = formatPercent(Number(value));
}

async function fetchMetrics() {
    try {
        const response = await fetch(`${API_BASE_URL}/metrics`);
        if (!response.ok) {
            throw new Error('Metrics request failed.');
        }

        const data = await response.json();

        updateMetric('val-accuracy', data.accuracy);
        updateMetric('val-f1score', data.f1_score);
        updateMetric('val-recall', data.recall);
        updateMetric('val-fpr', data.false_positive_rate);

        const precision = document.getElementById('val-precision');
        if (precision) {
            precision.innerText = formatPercent(Number(data.precision));
        }

        const apiStatus = document.getElementById('api-status');
        if (apiStatus) {
            apiStatus.innerText = 'API healthy';
        }
    } catch (error) {
        console.error('Failed to fetch metrics:', error);

        ['val-accuracy', 'val-f1score', 'val-recall', 'val-fpr', 'val-precision'].forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.innerText = 'Err';
            }
        });

        const apiStatus = document.getElementById('api-status');
        if (apiStatus) {
            apiStatus.innerText = 'API offline';
        }
    }
}

function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    if (!dropZone || !fileInput) {
        return;
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach((eventName) => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach((eventName) => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (event) => {
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', function onChange() {
        if (this.files.length > 0) {
            handleFile(this.files[0]);
        }
    });
}

function setUploadState(text, progressValue) {
    const statusText = document.getElementById('status-text');
    const progressBar = document.getElementById('progress');
    const statusDiv = document.getElementById('upload-status');

    if (statusText) {
        statusText.innerText = text;
    }

    if (progressBar && Number.isFinite(progressValue)) {
        progressBar.style.width = `${progressValue}%`;
    }

    if (statusDiv) {
        statusDiv.classList.remove('hidden');
    }
}

function clearUploadState() {
    const statusDiv = document.getElementById('upload-status');
    const progressBar = document.getElementById('progress');

    if (statusDiv) {
        statusDiv.classList.add('hidden');
    }

    if (progressBar) {
        progressBar.style.width = '0%';
    }
}

function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        window.alert('Please upload a valid CSV file.');
        return;
    }

    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
    }

    setUploadState(`Uploading ${file.name}...`, 24);

    const formData = new FormData();
    formData.append('file', file);

    window.setTimeout(() => {
        setUploadState('Analyzing flows via two-stage ensemble...', 62);

        fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            body: formData,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Prediction request failed.');
                }
                return response.json();
            })
            .then((data) => {
                setUploadState('Analysis complete.', 100);

                window.setTimeout(() => {
                    displayResults(data);
                    clearUploadState();
                }, 550);
            })
            .catch((error) => {
                console.error('Error:', error);
                setUploadState(`Error: ${error.message}`, 100);

                const progressBar = document.getElementById('progress');
                if (progressBar) {
                    progressBar.style.background = 'var(--danger)';
                }

                window.setTimeout(() => {
                    clearUploadState();
                    if (progressBar) {
                        progressBar.style.background = '';
                    }
                }, 2500);
            });
    }, 300);
}

function initChart() {
    const canvas = document.getElementById('threatChart');
    if (!canvas) {
        return;
    }

    const context = canvas.getContext('2d');

    Chart.defaults.color = '#86a6c8';
    Chart.defaults.font.family = "'IBM Plex Sans', sans-serif";

    threatChart = new Chart(context, {
        type: 'doughnut',
        data: {
            labels: ['Benign', 'Attacks'],
            datasets: [{
                data: [1, 0],
                backgroundColor: ['#3ee6b3', '#35d3ff'],
                borderColor: ['rgba(62, 230, 179, 0.2)', 'rgba(53, 211, 255, 0.2)'],
                borderWidth: 1,
                hoverOffset: 4,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                    },
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return ` ${context.label}: ${context.formattedValue}`;
                        },
                    },
                },
            },
        },
    });
}

function displayResults(data) {
    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
    }

    const totalFlows = Number(data.total_flows) || 0;
    const attackCount = Number(data.attack_count) || 0;
    const benignCount = Number(data.benign_count) || 0;
    const attackRate = Number.isFinite(Number(data.attack_percentage))
        ? Number(data.attack_percentage)
        : (totalFlows > 0 ? (attackCount / totalFlows) * 100 : 0);

    const totalElement = document.getElementById('res-total');
    const attackElement = document.getElementById('res-attacks');
    const benignElement = document.getElementById('res-benign');
    const attackRateElement = document.getElementById('res-attack-rate');

    if (totalElement) {
        totalElement.innerText = totalFlows.toLocaleString();
    }

    if (attackElement) {
        attackElement.innerText = attackCount.toLocaleString();
    }

    if (benignElement) {
        benignElement.innerText = benignCount.toLocaleString();
    }

    if (attackRateElement) {
        attackRateElement.innerText = formatPercent(attackRate);
    }

    if (threatChart) {
        threatChart.data.datasets[0].data = totalFlows > 0
            ? [benignCount, attackCount]
            : [1, 0];
        threatChart.update();
    }

    const attackList = document.getElementById('attack-list');
    if (!attackList) {
        return;
    }

    attackList.innerHTML = '';

    const attackTypeCounts = data.attack_type_counts && typeof data.attack_type_counts === 'object'
        ? data.attack_type_counts
        : {};

    const entries = Object.entries(attackTypeCounts).sort((left, right) => right[1] - left[1]);

    if (entries.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'attack-item';
        emptyItem.style.justifyContent = 'center';
        emptyItem.style.color = 'var(--muted)';
        emptyItem.textContent = 'No specific mapped attacks returned for this upload.';
        attackList.appendChild(emptyItem);
        return;
    }

    entries.forEach(([attackType, count]) => {
        const item = document.createElement('li');
        item.className = 'attack-item';

        const label = document.createElement('div');
        label.className = 'attack-type';
        label.textContent = attackType;

        const value = document.createElement('div');
        value.className = 'attack-count';
        value.textContent = `${Number(count).toLocaleString()} flows`;

        item.appendChild(label);
        item.appendChild(value);
        attackList.appendChild(item);
    });
}
