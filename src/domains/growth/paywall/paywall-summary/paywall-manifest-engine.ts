import * as numbers from "../../../../kit/numbers.js";
import { PaywallManifest } from "./paywall-manifest.js";

/** One step of the paywall manifest calculation. */
export interface PaywallManifestStep {
  describe(): string;
  adjust(item: PaywallManifest, value: number): number;
}

export class PercentPaywallManifestAdjuster implements PaywallManifestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PaywallManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPaywallManifestAdjuster implements PaywallManifestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPaywallManifestAdjuster implements PaywallManifestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the paywall manifest steps in order and keeps a trace of each. */
export class PaywallManifestEngine {
  steps: PaywallManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PaywallManifest): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PaywallManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPaywallManifestEngine(): PaywallManifestEngine {
  return new PaywallManifestEngine(
    [
      new PercentPaywallManifestAdjuster(16.3),
      new CapPaywallManifestAdjuster(40715),
      new MinimumPaywallManifestAdjuster(35.5),
    ],
    [],
    3,
    83906.1,
  );
}
