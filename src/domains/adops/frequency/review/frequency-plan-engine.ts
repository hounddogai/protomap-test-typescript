import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FrequencyPlan } from "./frequency-plan.js";

/** One step of the frequency plan calculation. */
export interface FrequencyPlanModifier {
  describe(): string;
  adjust(item: FrequencyPlan, value: number): number;
}

export class TieredFrequencyPlanAdjuster implements FrequencyPlanModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FrequencyPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFrequencyPlanAdjuster implements FrequencyPlanModifier {
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

  adjust(item: FrequencyPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFrequencyPlanAdjuster implements FrequencyPlanModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FrequencyPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FrequencyPlanRatioOffsetAdjuster implements FrequencyPlanModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: FrequencyPlan, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class PercentFrequencyPlanAdjuster implements FrequencyPlanModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FrequencyPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFrequencyPlanAdjuster implements FrequencyPlanModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the frequency plan steps in order and keeps a trace of each. */
export class FrequencyPlanEngine {
  steps: FrequencyPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FrequencyPlan): number {
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

  evaluateAll(items: FrequencyPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFrequencyPlanEngine(flagsValue: flags.Registry): FrequencyPlanEngine {
  return new FrequencyPlanEngine(
    [
      new TieredFrequencyPlanAdjuster([1465, 1490, 8383], [1.08, 0.97, 0.83]),
      new FlaggedFrequencyPlanAdjuster(flagsValue, "frequency-plan-weighted", -8.7),
      new CapFrequencyPlanAdjuster(1207),
      new FrequencyPlanRatioOffsetAdjuster(0.35),
      new PercentFrequencyPlanAdjuster(17.2),
      new MinimumFrequencyPlanAdjuster(2.2),
    ],
    [],
    3.5,
    69521.4,
  );
}
