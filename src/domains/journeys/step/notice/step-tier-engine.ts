import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StepTier } from "./step-tier.js";

/** One step of the step tier calculation. */
export interface StepTierModifier {
  describe(): string;
  adjust(item: StepTier, value: number): number;
}

export class TieredStepTierAdjuster implements StepTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StepTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapStepTierAdjuster implements StepTierModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StepTierBudgetOffsetAdjuster implements StepTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: StepTier, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class FlaggedStepTierAdjuster implements StepTierModifier {
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

  adjust(item: StepTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentStepTierAdjuster implements StepTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StepTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStepTierAdjuster implements StepTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StepTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the step tier steps in order and keeps a trace of each. */
export class StepTierEngine {
  steps: StepTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StepTier): number {
    let current = item.weightedValue();
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

  evaluateAll(items: StepTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStepTierEngine(flagsValue: flags.Registry): StepTierEngine {
  return new StepTierEngine(
    [
      new TieredStepTierAdjuster([227, 976, 7990], [1.04, 1.15, 0.89]),
      new CapStepTierAdjuster(20154),
      new StepTierBudgetOffsetAdjuster(1.62),
      new FlaggedStepTierAdjuster(flagsValue, "step-tier-adaptive", 6.2),
      new PercentStepTierAdjuster(-19.7),
      new MinimumStepTierAdjuster(17.9),
    ],
    [],
    2.9,
    60641.7,
  );
}
