import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultInsightAdjustment } from "./default-insight-adjustment.js";

/** One step of the default insight adjustment calculation. */
export interface DefaultInsightAdjustmentFactor {
  describe(): string;
  adjust(item: DefaultInsightAdjustment, value: number): number;
}

export class PercentDefaultInsightAdjustmentAdjuster implements DefaultInsightAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultInsightAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultInsightAdjustmentAdjuster implements DefaultInsightAdjustmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultInsightAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDefaultInsightAdjustmentAdjuster implements DefaultInsightAdjustmentFactor {
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

  adjust(item: DefaultInsightAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultInsightAdjustmentAdjuster implements DefaultInsightAdjustmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultInsightAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class DefaultInsightAdjustmentImpressionsOffsetAdjuster implements DefaultInsightAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: DefaultInsightAdjustment, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the default insight adjustment steps in order and keeps a trace of each. */
export class DefaultInsightAdjustmentEngine {
  steps: DefaultInsightAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultInsightAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultInsightAdjustment): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: DefaultInsightAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultInsightAdjustmentEngine(flagsValue: flags.Registry): DefaultInsightAdjustmentEngine {
  return new DefaultInsightAdjustmentEngine(
    [
      new PercentDefaultInsightAdjustmentAdjuster(-15.2),
      new TieredDefaultInsightAdjustmentAdjuster([969, 1041, 4011], [0.94, 0.88, 0.99]),
      new FlaggedDefaultInsightAdjustmentAdjuster(flagsValue, "default-insight-adjustment-legacy", 0.4),
      new MinimumDefaultInsightAdjustmentAdjuster(25),
      new DefaultInsightAdjustmentImpressionsOffsetAdjuster(1.7),
    ],
    [],
    2.5,
    85562.5,
  );
}
