export const initialPatient = {
  age: 55,
  bp: 80,
  sg: "1.020",
  al: 0,
  su: 0,
  rbc: "normal",
  pc: "normal",
  pcc: "notpresent",
  ba: "notpresent",
  bgr: 121,
  bu: 42,
  sc: 1.3,
  sod: 138,
  pot: 4.4,
  hemo: 12.7,
  pcv: 41,
  wc: 7800,
  rc: 4.8,
  htn: "no",
  dm: "no",
  cad: "no",
  appet: "good",
  pe: "no",
  ane: "no",
};

const toNumber = (value) => Number.parseFloat(value) || 0;

function addFactor(factors, key, label, points, active) {
  if (active) {
    factors.push({ key, label, points });
  }
}

export function predictKidneyRisk(values) {
  const patient = {
    ...values,
    age: toNumber(values.age),
    bp: toNumber(values.bp),
    sg: toNumber(values.sg),
    al: toNumber(values.al),
    su: toNumber(values.su),
    bgr: toNumber(values.bgr),
    bu: toNumber(values.bu),
    sc: toNumber(values.sc),
    sod: toNumber(values.sod),
    pot: toNumber(values.pot),
    hemo: toNumber(values.hemo),
    pcv: toNumber(values.pcv),
    wc: toNumber(values.wc),
    rc: toNumber(values.rc),
  };

  const factors = [];

  addFactor(factors, "age", "Age above 60 years", 0.55, patient.age >= 60);
  addFactor(factors, "bp", "Blood pressure at or above 90 mmHg", 0.8, patient.bp >= 90);
  addFactor(factors, "sg", "Low urine specific gravity", 1.2, patient.sg <= 1.015);
  addFactor(factors, "al", `Albumin level ${patient.al}`, 1.15 + patient.al * 0.22, patient.al > 0);
  addFactor(factors, "su", `Sugar level ${patient.su}`, 0.5 + patient.su * 0.12, patient.su > 0);
  addFactor(factors, "rbc", "Abnormal red blood cells", 0.8, patient.rbc === "abnormal");
  addFactor(factors, "pc", "Abnormal pus cells", 0.75, patient.pc === "abnormal");
  addFactor(factors, "pcc", "Pus cell clumps present", 0.72, patient.pcc === "present");
  addFactor(factors, "ba", "Bacteria present", 0.42, patient.ba === "present");
  addFactor(factors, "bgr", "Blood glucose above 180 mg/dL", 0.48, patient.bgr >= 180);
  addFactor(factors, "bu", "Blood urea above 50 mg/dL", 0.85, patient.bu > 50);
  addFactor(factors, "sc", "Serum creatinine above 1.5 mg/dL", 1.55, patient.sc > 1.5);
  addFactor(factors, "sod", "Sodium below 135 mEq/L", 0.58, patient.sod < 135);
  addFactor(factors, "pot", "Potassium above 5.2 mEq/L", 0.62, patient.pot > 5.2);
  addFactor(factors, "hemo", "Hemoglobin below 12 g/dL", 0.92, patient.hemo < 12);
  addFactor(factors, "pcv", "Packed cell volume below 36%", 0.72, patient.pcv < 36);
  addFactor(factors, "wc", "White blood cell count above 11000", 0.34, patient.wc > 11000);
  addFactor(factors, "rc", "Red blood cell count below 4.2", 0.72, patient.rc < 4.2);
  addFactor(factors, "htn", "Hypertension history", 1.0, patient.htn === "yes");
  addFactor(factors, "dm", "Diabetes mellitus history", 0.78, patient.dm === "yes");
  addFactor(factors, "cad", "Coronary artery disease history", 0.42, patient.cad === "yes");
  addFactor(factors, "appet", "Poor appetite", 0.48, patient.appet === "poor");
  addFactor(factors, "pe", "Pedal edema", 0.68, patient.pe === "yes");
  addFactor(factors, "ane", "Anemia", 0.62, patient.ane === "yes");

  const protective =
    (patient.sg >= 1.02 ? 0.45 : 0) +
    (patient.al === 0 ? 0.5 : 0) +
    (patient.su === 0 ? 0.25 : 0) +
    (patient.sc <= 1.2 ? 0.55 : 0) +
    (patient.hemo >= 13 ? 0.35 : 0) +
    (patient.htn === "no" ? 0.35 : 0) +
    (patient.dm === "no" ? 0.28 : 0);

  const rawScore = factors.reduce((total, factor) => total + factor.points, 0) - protective;
  const probability = 1 / (1 + Math.exp(-(rawScore - 2.7)));
  const percent = Math.round(probability * 100);

  let band = "Low";
  let status = "Not CKD likely";
  if (percent >= 70) {
    band = "High";
    status = "CKD likely";
  } else if (percent >= 40) {
    band = "Moderate";
    status = "Further review";
  }

  return {
    probability,
    percent,
    band,
    status,
    confidence: Math.round((0.58 + Math.abs(probability - 0.5) * 0.72) * 100),
    score: Number(rawScore.toFixed(2)),
    contributors: factors.sort((a, b) => b.points - a.points).slice(0, 5),
  };
}
