import React, { useMemo, useState } from "react";
import {
  Activity,
  ClipboardCheck,
  Droplet,
  HeartPulse,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  TestTube2,
} from "lucide-react";
import { initialPatient, predictKidneyRisk } from "./predictionEngine";

const sections = [
  {
    title: "Patient Vitals",
    icon: HeartPulse,
    fields: [
      { key: "age", label: "Age", unit: "years", type: "number", min: 2, max: 90 },
      { key: "bp", label: "Blood Pressure", unit: "mmHg", type: "number", min: 50, max: 180 },
    ],
  },
  {
    title: "Urine Analysis",
    icon: Droplet,
    fields: [
      { key: "sg", label: "Specific Gravity", type: "select", options: ["1.005", "1.010", "1.015", "1.020", "1.025"] },
      { key: "al", label: "Albumin", type: "select", options: [0, 1, 2, 3, 4, 5] },
      { key: "su", label: "Sugar", type: "select", options: [0, 1, 2, 3, 4, 5] },
      { key: "rbc", label: "Red Blood Cells", type: "select", options: ["normal", "abnormal"] },
      { key: "pc", label: "Pus Cell", type: "select", options: ["normal", "abnormal"] },
      { key: "pcc", label: "Pus Cell Clumps", type: "select", options: ["notpresent", "present"] },
      { key: "ba", label: "Bacteria", type: "select", options: ["notpresent", "present"] },
    ],
  },
  {
    title: "Blood Chemistry",
    icon: TestTube2,
    fields: [
      { key: "bgr", label: "Blood Glucose Random", unit: "mg/dL", type: "number", min: 22, max: 490 },
      { key: "bu", label: "Blood Urea", unit: "mg/dL", type: "number", min: 1.5, max: 391 },
      { key: "sc", label: "Serum Creatinine", unit: "mg/dL", type: "number", min: 0.4, max: 76, step: 0.1 },
      { key: "sod", label: "Sodium", unit: "mEq/L", type: "number", min: 4.5, max: 163, step: 0.1 },
      { key: "pot", label: "Potassium", unit: "mEq/L", type: "number", min: 2.5, max: 47, step: 0.1 },
    ],
  },
  {
    title: "Blood Count",
    icon: Activity,
    fields: [
      { key: "hemo", label: "Hemoglobin", unit: "g/dL", type: "number", min: 3.1, max: 17.8, step: 0.1 },
      { key: "pcv", label: "Packed Cell Volume", unit: "%", type: "number", min: 14, max: 54 },
      { key: "wc", label: "White Blood Cell Count", unit: "cells/cumm", type: "number", min: 2200, max: 26400 },
      { key: "rc", label: "Red Blood Cell Count", unit: "millions/cmm", type: "number", min: 2.1, max: 8, step: 0.1 },
    ],
  },
  {
    title: "Clinical History",
    icon: ClipboardCheck,
    fields: [
      { key: "htn", label: "Hypertension", type: "select", options: ["no", "yes"] },
      { key: "dm", label: "Diabetes Mellitus", type: "select", options: ["no", "yes"] },
      { key: "cad", label: "Coronary Artery Disease", type: "select", options: ["no", "yes"] },
      { key: "appet", label: "Appetite", type: "select", options: ["good", "poor"] },
      { key: "pe", label: "Pedal Edema", type: "select", options: ["no", "yes"] },
      { key: "ane", label: "Anemia", type: "select", options: ["no", "yes"] },
    ],
  },
];

const ckdSample = {
  age: 62,
  bp: 90,
  sg: "1.010",
  al: 3,
  su: 1,
  rbc: "abnormal",
  pc: "abnormal",
  pcc: "present",
  ba: "notpresent",
  bgr: 210,
  bu: 88,
  sc: 3.2,
  sod: 130,
  pot: 5.6,
  hemo: 9.8,
  pcv: 31,
  wc: 12400,
  rc: 3.4,
  htn: "yes",
  dm: "yes",
  cad: "no",
  appet: "poor",
  pe: "yes",
  ane: "yes",
};

function Field({ field, value, onChange }) {
  const id = `field-${field.key}`;

  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">
        {field.label}
        {field.unit ? <small>{field.unit}</small> : null}
      </span>
      {field.type === "select" ? (
        <select id={id} value={value} onChange={(event) => onChange(field.key, event.target.value)}>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {String(option)}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step || 1}
          value={value}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
      )}
    </label>
  );
}

function ResultPanel({ result }) {
  const stroke = `${result.percent}%`;

  return (
    <aside className="result-panel" aria-live="polite">
      <div className="result-header">
        <span className={`risk-chip ${result.band.toLowerCase()}`}>{result.band} Risk</span>
        <ShieldCheck size={22} aria-hidden="true" />
      </div>

      <div className="gauge" style={{ "--gauge": stroke }}>
        <div>
          <strong>{result.percent}%</strong>
          <span>{result.status}</span>
        </div>
      </div>

      <div className="result-metrics">
        <div>
          <span>Risk score</span>
          <strong>{result.score}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{result.confidence}%</strong>
        </div>
      </div>

      <div className="contributors">
        <h3>Top clinical signals</h3>
        {result.contributors.length ? (
          result.contributors.map((item) => (
            <div className="contributor" key={item.key}>
              <span>{item.label}</span>
              <strong>+{item.points.toFixed(2)}</strong>
            </div>
          ))
        ) : (
          <p>No elevated clinical signals in the current profile.</p>
        )}
      </div>

      <div className="pipeline-note">
        <Stethoscope size={18} aria-hidden="true" />
        <span>Built from the notebook feature set: ANN, LSTM, CNN classification workflow.</span>
      </div>
    </aside>
  );
}

export default function App() {
  const [patient, setPatient] = useState(initialPatient);
  const result = useMemo(() => predictKidneyRisk(patient), [patient]);

  const updateField = (key, value) => {
    setPatient((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <span className="eyebrow">Chronic Kidney Disease Predictor</span>
          <h1>Clinical risk screening dashboard</h1>
          <p>
            Enter patient lab values and history indicators to generate a CKD risk estimate aligned with the project
            dataset.
          </p>
        </div>
        <div className="hero-actions">
          <button className="ghost-button" type="button" onClick={() => setPatient(initialPatient)}>
            <RotateCcw size={18} aria-hidden="true" />
            Reset
          </button>
          <button className="primary-button" type="button" onClick={() => setPatient(ckdSample)}>
            <Activity size={18} aria-hidden="true" />
            Sample CKD Case
          </button>
        </div>
      </section>

      <section className="workspace">
        <div className="form-grid">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section className="panel" key={section.title}>
                <div className="panel-title">
                  <Icon size={20} aria-hidden="true" />
                  <h2>{section.title}</h2>
                </div>
                <div className="fields">
                  {section.fields.map((field) => (
                    <Field key={field.key} field={field} value={patient[field.key]} onChange={updateField} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <ResultPanel result={result} />
      </section>
    </main>
  );
}
