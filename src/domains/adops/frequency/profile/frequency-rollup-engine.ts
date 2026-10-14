import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FrequencyRollup } from "./frequency-rollup.js";

/** One step of the frequency rollup calculation. */
export interface FrequencyRollupModifier {
  describe(): string;
  adjust(item: FrequencyRollup, value: number): number;
}

export class MinimumFrequencyRollupAdjuster implements FrequencyRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFrequencyRollupAdjuster implements FrequencyRollupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameFrequencyRollupAdjuster implements FrequencyRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FrequencyRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFrequencyRollupAdjuster implements FrequencyRollupModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: FrequencyRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the frequency rollup steps in order and keeps a trace of each. */
export class FrequencyRollupEngine {
  steps: FrequencyRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FrequencyRollup): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: FrequencyRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFrequencyRollupEngine(flagsValue: flags.Registry): FrequencyRollupEngine {
  return new FrequencyRollupEngine(
    [
      new MinimumFrequencyRollupAdjuster(43.4),
      new PercentFrequencyRollupAdjuster(-12.2),
      new NameFrequencyRollupAdjuster(new Map<string, number>([["retail", 0.76]])),
      new FlaggedFrequencyRollupAdjuster(flagsValue, "frequency-rollup-strict", -6.7),
    ],
    [],
    0.5,
    55120.8,
  );
}
