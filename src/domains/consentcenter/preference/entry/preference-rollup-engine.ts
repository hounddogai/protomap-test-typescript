import * as numbers from "../../../../kit/numbers.js";
import { PreferenceRollup } from "./preference-rollup.js";

/** One step of the preference rollup calculation. */
export interface PreferenceRollupAdjuster {
  describe(): string;
  adjust(item: PreferenceRollup, value: number): number;
}

export class PercentPreferenceRollupAdjuster implements PreferenceRollupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PreferenceRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPreferenceRollupAdjuster implements PreferenceRollupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPreferenceRollupAdjuster implements PreferenceRollupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the preference rollup steps in order and keeps a trace of each. */
export class PreferenceRollupEngine {
  steps: PreferenceRollupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceRollupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PreferenceRollup): number {
    let current = item.netLoad();
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

  evaluateAll(items: PreferenceRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPreferenceRollupEngine(): PreferenceRollupEngine {
  return new PreferenceRollupEngine(
    [
      new PercentPreferenceRollupAdjuster(-3.4),
      new TieredPreferenceRollupAdjuster([160, 8058], [0.93, 0.8]),
      new RoundingPreferenceRollupAdjuster(0.05),
    ],
    [],
    0.3,
    48433.1,
  );
}
