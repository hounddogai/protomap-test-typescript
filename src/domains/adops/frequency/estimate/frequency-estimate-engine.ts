import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FrequencyEstimate } from "./frequency-estimate.js";

/** One step of the frequency estimate calculation. */
export interface FrequencyEstimateModifier {
  describe(): string;
  adjust(item: FrequencyEstimate, value: number): number;
}

export class PercentFrequencyEstimateAdjuster implements FrequencyEstimateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedFrequencyEstimateAdjuster implements FrequencyEstimateModifier {
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

  adjust(item: FrequencyEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFrequencyEstimateAdjuster implements FrequencyEstimateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFrequencyEstimateAdjuster implements FrequencyEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FrequencyEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelFrequencyEstimateAdjuster implements FrequencyEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FrequencyEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the frequency estimate steps in order and keeps a trace of each. */
export class FrequencyEstimateEngine {
  steps: FrequencyEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FrequencyEstimate): number {
    let current = item.netTotal();
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

  evaluateAll(items: FrequencyEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFrequencyEstimateEngine(flagsValue: flags.Registry): FrequencyEstimateEngine {
  return new FrequencyEstimateEngine(
    [
      new PercentFrequencyEstimateAdjuster(22.2),
      new FlaggedFrequencyEstimateAdjuster(flagsValue, "frequency-estimate-primary", -4.1),
      new MinimumFrequencyEstimateAdjuster(47.8),
      new TieredFrequencyEstimateAdjuster([573, 2656, 5800, 9312], [1.11, 0.83, 1.14, 0.87]),
      new LabelFrequencyEstimateAdjuster(new Map<string, number>([["online", 1.2]])),
    ],
    [],
    3.4,
    59733.4,
  );
}
