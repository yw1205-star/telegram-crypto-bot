// =======================================================
// 📄 File: data/products.js
// Purpose: Catalog of Asian countries + bundle price mapping
// Folder: data/
// =======================================================

module.exports = {
  productUpdate: {
    date: "2025-10-13",
    time: "16:45",
  },

  // 🌏 Product lists by country
  productsByLocation: {
    Malaysia: [
      { name: "Turbo LED Headlamp", price: 89.99, sku: "MY-LED1", desc: "Durable LED headlamp with high lumen output." },
      { name: "Car Speaker BassPro", price: 120.0, sku: "MY-SP1", desc: "Deep bass car speaker for rich sound." },
    ],
    Singapore: [
      { name: "SG Smart Headlamp", price: 95.0, sku: "SG-LED1", desc: "Stable beam LED headlamp for urban drivers." },
      { name: "Audio Blaster X", price: 135.5, sku: "SG-AU1", desc: "Premium audio system for smooth listening." },
    ],
    Thailand: [
      { name: "TH Power Beam", price: 88.5, sku: "TH-LED1", desc: "Energy-efficient LED headlamp." },
      { name: "BassMax Speaker", price: 110.0, sku: "TH-SP1", desc: "Enhanced bass clarity speaker system." },
    ],
    Philippines: [
      { name: "PH NightVision LED", price: 82.5, sku: "PH-LED1", desc: "Bright LED for night driving safety." },
      { name: "SoundWave Pro", price: 118.75, sku: "PH-SP1", desc: "Powerful car speaker system." },
    ],
    Cambodia: [
      { name: "CB DriveBright LED", price: 77.99, sku: "CB-LED1", desc: "Reliable and long-lasting LED light." },
      { name: "BeatBoost Speaker", price: 112.0, sku: "CB-SP1", desc: "Compact speaker with high power output." },
    ],
    Vietnam: [
      { name: "VN Lumina Beam", price: 84.25, sku: "VN-LED1", desc: "Perfect illumination for every road." },
      { name: "SonicPulse Audio", price: 119.0, sku: "VN-SP1", desc: "Balanced sound for every car type." },
    ],
    Indonesia: [
      { name: "ID HyperLED", price: 86.75, sku: "ID-LED1", desc: "Efficient headlamp with long lifespan." },
      { name: "RhythmX Speaker", price: 115.25, sku: "ID-SP1", desc: "Speaker with strong bass resonance." },
    ],
  },

  // 📦 Bundle pricing by product name
  bundlePrices: {
    "Turbo LED Headlamp": {
      1: 89.99,
      3: 259.97,
      7: 599.93,
      11: 959.89,
    },
    "Car Speaker BassPro": {
      1: 120.0,
      3: 339.99,
      7: 779.99,
      11: 1219.99,
    },
    "SG Smart Headlamp": {
      1: 95.0,
      3: 279.0,
      7: 665.0,
    },
    "Audio Blaster X": {
      1: 135.5,
      3: 399.0,
      7: 899.0,
    },
  },
};
