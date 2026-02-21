// ===== CORE STATE =====

let credits = 1000;

let speedLevel = 0;
let efficiencyLevel = 0;

let baseProductionTime = 7;
let productionTimer = 0;

let inventory = 0;
let itemsSold = 0;

let baseDemand = 45;

let saleTimer = 0;
let baseSaleInterval = 4;

let advertisingLevel = 0;
let logisticsLevel = 0;

let influence = 0;
let lifetimeSold = 0;

let milestoneIndex = 0;

const milestones = [
  { sold: 100, text: "Market recognition achieved." },
  { sold: 500, text: "Demand surging across the club." },
  { sold: 1000, text: "Regional dominance established." },
  { sold: 5000, text: "Brand reputation skyrocketing." },
  { sold: 10000, text: "Market domination achieved." }
];

// ===== SIMPLE ECONOMY =====

function getProductionTime() {
  return baseProductionTime *
    Math.pow(0.98, speedLevel);
}

function getBaseProductionValue() {
  return 50 * Math.pow(1.12, speedLevel + influence);
}

function getProductionCost() {
  return Math.round(
    getBaseProductionValue() *
    Math.pow(0.995, efficiencyLevel)
  );
}

function getSellPrice() {
  return Math.round(
    getBaseProductionValue() * 1.55 *
    (1 + advertisingLevel * 0.002) *
    (1 + influence * 0.003)
  );
}

function getSellChance() {
  return Math.min(0.99,
    (getDemand() / 100) +
    influence * 0.002
  );
}

function getSpeedCost() {
  return 50 * Math.pow(1.85, speedLevel);
}

function getEfficiencyCost() {
  return 120 * Math.pow(1.7, efficiencyLevel);
}

function getDemand() {
  return Math.min(95,
    baseDemand * Math.pow(1.025, advertisingLevel)
  );
}

function getLogisticsCost() {
  return 100 * Math.pow(1.4, logisticsLevel);
}

function getSaleInterval() {
  return baseSaleInterval * Math.pow(0.99, logisticsLevel);
}

function getGuaranteedOutput() {
  return 1 + Math.floor(speedLevel / 12);
}

function getBonusOutputChance() {
  return speedLevel * 0.5;
}

function getGuaranteedSales() {
  return 1 + Math.floor(advertisingLevel / 10);
}

function getBonusSaleChance() {
  return advertisingLevel * 0.35 +
         influence * 0.25;
}

function getAdvertisingCost() {
  return 200 * Math.pow(1.55, advertisingLevel);
}

function getPrestigeGain() {
  return Math.floor(Math.sqrt(lifetimeSold / 50));
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
    progressBar.classList.add("complete");
    setTimeout(() => progressBar.classList.remove("complete"), 150);
  }

  saleTimer += delta;

  if (saleTimer >= getSaleInterval()) {
    attemptSales();
    progressBar.classList.add("complete");
    setTimeout(() => progressBar.classList.remove("complete"), 150);
    saleTimer = 0;
  }

  updateSaleProgressBar((saleTimer / getSaleInterval()) * 100);
  updateProgressBar((productionTimer / getProductionTime()) * 100);
  updateUI();
}

function attemptSales() {
  if (inventory <= 0) return;

  let attempts = getGuaranteedSales();

  // bonus extra sale chance
  if (Math.random() < getBonusSaleChance() / 100) {
    attempts++;
  }

  let soldThisTick = 0;

  for (let i = 0; i < attempts; i++) {
    if (inventory <= 0) break;

    if (Math.random() < getSellChance()) {
      inventory--;
      soldThisTick++;
    }
  }

  if (soldThisTick > 0) {
    let earnings = soldThisTick * getSellPrice();

    credits += earnings;
    itemsSold += soldThisTick;
    lifetimeSold += soldThisTick;

    showFloatingCredits(earnings);
  }

    if (
      milestoneIndex < milestones.length &&
      lifetimeSold >= milestones[milestoneIndex].sold
    ) {
      showMilestone(milestones[milestoneIndex].text);
      milestoneIndex++;
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
  if (credits < cost) {
    document.body.classList.add("shake");
    setTimeout(()=>document.body.classList.remove("shake"), 200);
    return;
  }
  if (credits >= cost) {
    credits -= cost;
    speedLevel++;
    flashStat("speedValue");
  }
  updateUI();
}

function upgradeEfficiency() {
  let cost = getEfficiencyCost();

  if (credits < cost) {
    document.body.classList.add("shake");
    setTimeout(() => document.body.classList.remove("shake"), 200);
    return;
  }
  if (credits >= cost) {
    credits -= cost;
    efficiencyLevel++;
    flashStat("efficiencyValue");
  }
  updateUI();
}

function upgradeAdvertising() {
  let cost = getAdvertisingCost();
  if (credits < cost) {
    document.body.classList.add("shake");
    setTimeout(()=>document.body.classList.remove("shake"), 200);
    return;
  }
  if (credits >= cost) {
    credits -= cost;
    advertisingLevel++;
    flashStat("advertisingValue");
  }
  updateUI();
}

function upgradeLogistics() {
  let cost = getLogisticsCost();
   if (credits < cost) {
    document.body.classList.add("shake");
    setTimeout(()=>document.body.classList.remove("shake"), 200);
    return;
  }
  if (credits >= cost) {
    credits -= cost;
    logisticsLevel++;
    flashStat("logisticsValue");
  }
  updateUI();
}


// ===== UI =====

function updateUI() {
  document.getElementById("credits").innerText = 
    formatNumber(credits);
  document.getElementById("inventory").innerText = 
    formatNumber(inventory);
  document.getElementById("itemsSold").innerText = 
    formatNumber(itemsSold);
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

  let reduction = 1 - Math.pow(0.995, efficiencyLevel);
  document.getElementById("efficiencyValue").innerText =   
  (reduction * 100).toFixed(1) + "%";

  document.getElementById("saleIntervalValue").innerText = 
    getSaleInterval().toFixed(2);
  document.getElementById("outputValue").innerText = 
  formatNumber(getGuaranteedOutput()) + " (+" + getBonusOutputChance().toFixed(1) + "%)";
  document.getElementById("influenceValue").innerText = influence;
  document.getElementById("prestigeGain").innerText = getPrestigeGain();
  document.getElementById("saleCapacity").innerText = 
  getGuaranteedSales() + " (+" + getBonusSaleChance().toFixed(1) + "%)";

  let profitItem = getSellPrice() - getProductionCost();
  document.getElementById("profitItem").innerText = formatNumber(profitItem);

  let nextTarget = Math.pow((getPrestigeGain() + 1), 2) * 50;
  document.getElementById("nextInfluence").innerText =
  formatNumber(Math.max(0, nextTarget - lifetimeSold));

  const effBtn = document.getElementById("efficiencyBtn");
  const spdBtn = document.getElementById("speedBtn");
  const demBtn = document.getElementById("demandBtn");
  const logBtn = document.getElementById("logisticsBtn");

  if (effBtn)
    effBtn.title = "Upgrade (" + formatNumber(getEfficiencyCost()) + ")";

  if (spdBtn)
    spdBtn.title = "Upgrade (" + formatNumber(getSpeedCost()) + ")";

  if (demBtn)
    demBtn.title = "Upgrade (" + formatNumber(getAdvertisingCost()) + ")";

  if (logBtn)
    logBtn.title = "Upgrade (" + formatNumber(getLogisticsCost()) + ")";

  updateMarketMood();
}

function updateSaleProgressBar(percent) {
  let bar = document.getElementById("saleProgressBar");
  bar.style.width = Math.min(percent, 100) + "%";
}

function updateProgressBar(percent) {
  let bar = document.getElementById("progressBar");
  bar.style.width = Math.min(percent, 100) + "%";
}

function prestigeReset() {

  let gain = getPrestigeGain();
  if (gain <= 0) return;

  influence += gain;

  // reset progress
  credits = 1000;
  speedLevel = 0;
  efficiencyLevel = 0;  
  advertisingLevel = 0;
  logisticsLevel = 0;
  inventory = 0;
  itemsSold = 0;
  lifetimeSold = 0;

  saveGame();
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
    speedLevel,
    efficiencyLevel,
    inventory,
    itemsSold,
    advertisingLevel,
    logisticsLevel,
    influence,
    lifetimeSold
  };

  localStorage.setItem("ddcIndustriesSave", JSON.stringify(saveData));
}

function loadGame() {
  const saved = localStorage.getItem("ddcIndustriesSave");
  if (!saved) return;

  const data = JSON.parse(saved);

  credits = data.credits ?? 1000;
  speedLevel = data.speedLevel ?? 0;
  efficiencyLevel = data.efficiencyLevel ?? 0;
  inventory = data.inventory ?? 0;
  itemsSold = data.itemsSold ?? 0;
  advertisingLevel = data.advertisingLevel ?? 0;
  logisticsLevel = data.logisticsLevel ?? 0;
  influence = data.influence ?? 0;
  lifetimeSold = data.lifetimeSold ?? 0;
}

function resetGame() {
  if (!confirm("Are you sure you want to start over?")) return;

  localStorage.removeItem("ddcIndustriesSave");

  credits = 1000;
  speedLevel = 0;
  efficiencyLevel = 0;
  advertisingLevel = 0;
  inventory = 0;
  itemsSold = 0;
  logisticsLevel = 0;
  influence = 0;
  lifetimeSold = 0;
  saveGame();
}

function flashStat(id) {
  const el = document.getElementById(id);
  if (!el) return;

  el.classList.remove("stat-flash");
  void el.offsetWidth;
  el.classList.add("stat-flash");
}

function showFloatingCredits(amount) {
  const el = document.createElement("div");
  el.className = "float-credit";
  el.innerText = "+" + formatNumber(amount);

  const marketPanel = document.querySelector(".panel:nth-child(2)");

  marketPanel.style.position = "relative";
  marketPanel.appendChild(el);

  el.style.left = "-20%";
  el.style.top = "20%";
  el.style.transform = "translate(-50%, -50%)";

  setTimeout(() => el.remove(), 1200);
}

function showMilestone(text) {
  const el = document.createElement("div");
  el.className = "milestone-popup";
  el.innerText = text;

  document.body.appendChild(el);

  setTimeout(() => el.remove(), 6000);
}

function updateMarketMood() {
  let mood = "Market stable.";

  if (getDemand() > 80) mood = "Demand surging.";
  else if (inventory === 0) mood = "Market hungry.";
  else if (credits > 100000) mood = "Profits booming.";
  else if (getSellChance() > 0.95) mood = "Customers can't get enough.";

  document.getElementById("marketMood").innerText = mood;
}

