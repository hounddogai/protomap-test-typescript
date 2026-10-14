import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckManifest } from "./fraud-check-manifest.js";

/** One step of the fraud check manifest calculation. */
export interface FraudCheckManifestModifier {
  describe(): string;
  adjust(item: FraudCheckManifest, value: number): number;
}

export class CapFraudCheckManifestAdjuster implements FraudCheckManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FraudCheckManifestAttemptsOffsetAdjuster implements FraudCheckManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: FraudCheckManifest, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class UnitFraudCheckManifestAdjuster implements FraudCheckManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: FraudCheckManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFraudCheckManifestAdjuster implements FraudCheckManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fraud check manifest steps in order and keeps a trace of each. */
export class FraudCheckManifestEngine {
  steps: FraudCheckManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FraudCheckManifest): number {
    let current = item.netExposure();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: FraudCheckManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFraudCheckManifestEngine(): FraudCheckManifestEngine {
  return new FraudCheckManifestEngine(
    [
      new CapFraudCheckManifestAdjuster(23238),
      new FraudCheckManifestAttemptsOffsetAdjuster(0.93),
      new UnitFraudCheckManifestAdjuster(new Map<string, number>([["west", 1.18]])),
      new RoundingFraudCheckManifestAdjuster(5),
    ],
    [],
    4.8,
    11740.5,
  );
}
