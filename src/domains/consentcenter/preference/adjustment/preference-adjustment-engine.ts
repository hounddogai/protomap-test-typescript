import * as numbers from "../../../../kit/numbers.js";
import { PreferenceAdjustment } from "./preference-adjustment.js";

/** One step of the preference adjustment calculation. */
export interface PreferenceAdjustmentStep {
  describe(): string;
  adjust(item: PreferenceAdjustment, value: number): number;
}

export class PercentPreferenceAdjustmentAdjuster implements PreferenceAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPreferenceAdjustmentAdjuster implements PreferenceAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitlePreferenceAdjustmentAdjuster implements PreferenceAdjustmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PreferenceAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the preference adjustment steps in order and keeps a trace of each. */
export class PreferenceAdjustmentEngine {
  steps: PreferenceAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PreferenceAdjustment): number {
    let current = item.weightedValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: PreferenceAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPreferenceAdjustmentEngine(): PreferenceAdjustmentEngine {
  return new PreferenceAdjustmentEngine(
    [
      new PercentPreferenceAdjustmentAdjuster(-4.9),
      new RoundingPreferenceAdjustmentAdjuster(5),
      new TitlePreferenceAdjustmentAdjuster(
        new Map<string, number>([["west", 0.98], ["central", 1.11], ["east", 1.34]]),
      ),
    ],
    [],
    2.9,
    14970.7,
  );
}
