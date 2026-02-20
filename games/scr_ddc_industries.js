// ===== CORE STATE =====

let credits = 200;
let tier = 1;

let speedLevel = 0;

let baseProductionTime = 10;
let productionTimer = 0;

let inventory = 0;
let itemsSold = 0;

let baseDemand = 30;

let saleTimer = 0;
let baseSaleInterval = 6;

let advertisingLevel = 0;
let logisticsLevel = 0;

// ===== SIMPLE ECONOMY =====

function getProductionTime() {
  return baseProductionTime * Math.pow(0.96, speedLevel);
}

function getProductionCost() {
  return 8 * Math.pow(1.55, tier);
}

function getSellPrice() {
  return getProductionCost() * 1.35;
}

function getSellChance() {
  return getDemand() / 100;
}

function getSpeedCost() {
  return 50 * Math.pow(1.85, speedLevel);
}

function getTierCost() {
  return getProductionCost() * 3;
}

function getDemand() {
  return baseDemand * Math.pow(1.035, advertisingLevel);
}

function getLogisticsCost() {
  return 400 * Math.pow(1.9, logisticsLevel);
}

function getSaleInterval() {
  return baseSaleInterval * Math.pow(0.99, logisticsLevel);
}

function getGuaranteedOutput() {
  return 1 + Math.floor(tier / 10);
}

function getBonusOutputChance() {
  return tier * 1; // percent
}


// ===== GAME LOOP =====

function gameLoop(delta) {
  productionTimer += delta;

  if (productionTimer >= getProductionTime()) {
    productionTimer = 0;

    let cost = getProductionCost();

    if (credits >= cost) {
      credits -= cost;
      
      let produced = getGuaranteedOutput();

      if (Math.random() < getBonusOutputChance() / 100) {
        produced++;
      }

      inventory += produced;

    }
  }

  saleTimer += delta;

  if (saleTimer >= getSaleInterval()) {
    attemptSales();
    saleTimer = 0;
  }

  updateSaleProgressBar((saleTimer / getSaleInterval()) * 100);
  updateProgressBar((productionTimer / getProductionTime()) * 100);
  updateUI();
}

function attemptSales() {
  if (inventory <= 0) return;

  if (Math.random() < getSellChance()) {
    inventory--;
    credits += getSellPrice();
    itemsSold++;
  }
}

let lastTime = Date.now();
let autoSaveTimer = 0;

function mainLoop() {

  let now = Date.now();
  let delta = (now - lastTime) / 1000;
  lastTime = now;

  gameLoop(delta);

  autoSaveTimer += delta;
  if (autoSaveTimer >= 5) {
    saveGame();
    autoSaveTimer = 0;
  }

  requestAnimationFrame(mainLoop);
}

loadGame();
mainLoop();

// ===== UPGRADES =====

function upgradeSpeed() {
  let cost = getSpeedCost();
  if (credits >= cost) {
    credits -= cost;
    speedLevel++;
  }
}

function upgradeTier() {
  let cost = getTierCost();
  if (credits >= cost) {
    credits -= cost;
    tier++;
  }
}

function upgradeAdvertising() {
  let cost = getAdvertisingCost();
  if (credits >= cost) {
    credits -= cost;
    advertisingLevel++;
  }
}

function getAdvertisingCost() {
  return 300 * Math.pow(1.6, advertisingLevel);
}

function upgradeLogistics() {
  let cost = getLogisticsCost();
  if (credits >= cost) {
    credits -= cost;
    logisticsLevel++;
  }
}

// ===== UI =====

function updateUI() {
  document.getElementById("credits").innerText = formatNumber(credits);
  document.getElementById("tier").innerText = tier;
  document.getElementById("inventory").innerText = formatNumber(inventory);
  document.getElementById("itemsSold").innerText = formatNumber(itemsSold);
  document.getElementById("demandValue").innerText =
  formatNumber(getDemand());

  document.getElementById("prodCost").innerText =
    formatNumber(getProductionCost());

  document.getElementById("sellPrice").innerText =
    formatNumber(getSellPrice());

  document.getElementById("profitItem").innerText =
    formatNumber(getSellPrice() - getProductionCost());

  document.getElementById("prodTime").innerText =
    getProductionTime().toFixed(2);

  document.getElementById("speedLevel").innerText = speedLevel;
  document.getElementById("advertisingLevel").innerText = advertisingLevel;

  document.getElementById("speedBtn").innerText =
    formatNumber(getSpeedCost());

  document.getElementById("tierBtn").innerText =
    "Upgrade Tier (" + formatNumber(getTierCost()) + ")";

  document.getElementById("demandBtn").innerText =
    formatNumber(getAdvertisingCost());

  document.getElementById("speedBtn").disabled =
    credits < getSpeedCost();

  document.getElementById("tierBtn").disabled =
    credits < getTierCost();

  document.getElementById("demandBtn").disabled =
    credits < getAdvertisingCost();

    document.getElementById("logisticsLevel").innerText = logisticsLevel;

  document.getElementById("logisticsBtn").innerText =
  formatNumber(getLogisticsCost());

  document.getElementById("logisticsBtn").disabled =
  credits < getLogisticsCost();

  document.getElementById("saleIntervalValue").innerText =
  getSaleInterval().toFixed(2);

  document.getElementById("outputValue").innerText =
  getGuaranteedOutput() + " + " + getBonusOutputChance() + "%";
}

function updateSaleProgressBar(percent) {
  let bar = document.getElementById("saleProgressBar");
  bar.style.width = Math.min(percent, 100) + "%";
}

function updateProgressBar(percent) {
  let bar = document.getElementById("progressBar");
  bar.style.width = Math.min(percent, 100) + "%";
}

// ===== FORMATTERS =====

function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return Math.floor(num);
}

function formatSmallNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  if (num >= 1) return num.toFixed(2);
  if (num > 0.001) return num.toFixed(4);
  if (num > 0) return num.toExponential(2);
  return "0.0000";
}

// ===== SAVE SYSTEM =====

function saveGame() {
  const saveData = {
    credits,
    tier,
    speedLevel,
    inventory,
    itemsSold,
    advertisingLevel,
    logisticsLevel
  };

  localStorage.setItem("ddcIndustriesSave", JSON.stringify(saveData));
}

function loadGame() {
  const saved = localStorage.getItem("ddcIndustriesSave");
  if (!saved) return;

  const data = JSON.parse(saved);

  credits = data.credits ?? 200;
  tier = data.tier ?? 1;
  speedLevel = data.speedLevel ?? 0;
  inventory = data.inventory ?? 0;
  itemsSold = data.itemsSold ?? 0;
  advertisingLevel = data.advertisingLevel ?? 0;
  logisticsLevel = data.logisticsLevel ?? 0;
}

function resetGame() {
  if (!confirm("Are you sure you want to start over?")) return;

  localStorage.removeItem("ddcIndustriesSave");

  credits = 200;
  tier = 1;
  speedLevel = 0;
  advertisingLevel = 0;
  inventory = 0;
  itemsSold = 0;
  logisticsLevel = 0;

  saveGame();
}