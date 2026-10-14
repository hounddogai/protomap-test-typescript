import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ActivationMetric } from "./activation-metric.js";

/** One step of the activation metric calculation. */
export interface ActivationMetricModifier {
  describe(): string;
  adjust(item: ActivationMetric, value: number): number;
}

export class PercentActivationMetricAdjuster implements ActivationMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ActivationMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ActivationMetricVersionOffsetAdjuster implements ActivationMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: ActivationMetric, value: number): number {
    return value + item.version * this.weight;
  }
}

export class CapActivationMetricAdjuster implements ActivationMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedActivationMetricAdjuster implements ActivationMetricModifier {
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

  adjust(item: ActivationMetric, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredActivationMetricAdjuster implements ActivationMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the activation metric steps in order and keeps a trace of each. */
export class ActivationMetricEngine {
  steps: ActivationMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ActivationMetric): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ActivationMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultActivationMetricEngine(flagsValue: flags.Registry): ActivationMetricEngine {
  return new ActivationMetricEngine(
    [
      new PercentActivationMetricAdjuster(-21.8),
      new ActivationMetricVersionOffsetAdjuster(1.14),
      new CapActivationMetricAdjuster(10204),
      new FlaggedActivationMetricAdjuster(flagsValue, "activation-metric-primary", 8.9),
      new TieredActivationMetricAdjuster([2853, 4881, 6232], [1.09, 0.85, 1.07]),
    ],
    [],
    5,
    86355.7,
  );
}
