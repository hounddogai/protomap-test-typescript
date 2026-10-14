import * as numbers from "../../../../kit/numbers.js";
import { GlobalSlaPreference } from "./global-sla-preference.js";

/** One step of the global sla preference calculation. */
export interface GlobalSlaPreferenceAdjuster {
  describe(): string;
  adjust(item: GlobalSlaPreference, value: number): number;
}

export class PercentGlobalSlaPreferenceAdjuster implements GlobalSlaPreferenceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalSlaPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalSlaPreferenceAdjuster implements GlobalSlaPreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalSlaPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapGlobalSlaPreferenceAdjuster implements GlobalSlaPreferenceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalSlaPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class GlobalSlaPreferenceCreatedAtOffsetAdjuster implements GlobalSlaPreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: GlobalSlaPreference, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the global sla preference steps in order and keeps a trace of each. */
export class GlobalSlaPreferenceEngine {
  steps: GlobalSlaPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalSlaPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalSlaPreference): number {
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

  evaluateAll(items: GlobalSlaPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalSlaPreferenceEngine(): GlobalSlaPreferenceEngine {
  return new GlobalSlaPreferenceEngine(
    [
      new PercentGlobalSlaPreferenceAdjuster(-20.3),
      new MinimumGlobalSlaPreferenceAdjuster(48.1),
      new CapGlobalSlaPreferenceAdjuster(10818),
      new GlobalSlaPreferenceCreatedAtOffsetAdjuster(1.93),
    ],
    [],
    1.7,
    56199.4,
  );
}
