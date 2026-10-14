import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedWaitProfile } from "./weighted-wait-profile.js";

/** One step of the weighted wait profile calculation. */
export interface WeightedWaitProfileStep {
  describe(): string;
  adjust(item: WeightedWaitProfile, value: number): number;
}

export class RoundingWeightedWaitProfileAdjuster implements WeightedWaitProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedWaitProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWeightedWaitProfileAdjuster implements WeightedWaitProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedWaitProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedWaitProfileAdjuster implements WeightedWaitProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedWaitProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedWeightedWaitProfileAdjuster implements WeightedWaitProfileStep {
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

  adjust(item: WeightedWaitProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelWeightedWaitProfileAdjuster implements WeightedWaitProfileStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedWaitProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WeightedWaitProfileQuantityOffsetAdjuster implements WeightedWaitProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: WeightedWaitProfile, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the weighted wait profile steps in order and keeps a trace of each. */
export class WeightedWaitProfileEngine {
  steps: WeightedWaitProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedWaitProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedWaitProfile): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: WeightedWaitProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedWaitProfileEngine(flagsValue: flags.Registry): WeightedWaitProfileEngine {
  return new WeightedWaitProfileEngine(
    [
      new RoundingWeightedWaitProfileAdjuster(5),
      new PercentWeightedWaitProfileAdjuster(5.9),
      new MinimumWeightedWaitProfileAdjuster(26),
      new FlaggedWeightedWaitProfileAdjuster(flagsValue, "weighted-wait-profile-scheduled", 9.8),
      new LabelWeightedWaitProfileAdjuster(new Map<string, number>([["east", 0.89], ["west", 0.87]])),
      new WeightedWaitProfileQuantityOffsetAdjuster(1.46),
    ],
    [],
    3.5,
    79908.2,
  );
}
