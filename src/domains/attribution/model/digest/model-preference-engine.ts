import * as numbers from "../../../../kit/numbers.js";
import { ModelPreference } from "./model-preference.js";

/** One step of the model preference calculation. */
export interface ModelPreferenceModifier {
  describe(): string;
  adjust(item: ModelPreference, value: number): number;
}

export class CapModelPreferenceAdjuster implements ModelPreferenceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelModelPreferenceAdjuster implements ModelPreferenceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ModelPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentModelPreferenceAdjuster implements ModelPreferenceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the model preference steps in order and keeps a trace of each. */
export class ModelPreferenceEngine {
  steps: ModelPreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelPreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ModelPreference): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ModelPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultModelPreferenceEngine(): ModelPreferenceEngine {
  return new ModelPreferenceEngine(
    [
      new CapModelPreferenceAdjuster(22452),
      new ChannelModelPreferenceAdjuster(new Map<string, number>([["south", 0.97]])),
      new PercentModelPreferenceAdjuster(17),
    ],
    [],
    1.1,
    10701,
  );
}
