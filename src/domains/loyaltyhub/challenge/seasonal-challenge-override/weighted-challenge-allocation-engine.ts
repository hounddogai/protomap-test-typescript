import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedChallengeAllocation } from "./weighted-challenge-allocation.js";

/** One step of the weighted challenge allocation calculation. */
export interface WeightedChallengeAllocationStep {
  describe(): string;
  adjust(item: WeightedChallengeAllocation, value: number): number;
}

export class PercentWeightedChallengeAllocationAdjuster implements WeightedChallengeAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedChallengeAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedChallengeAllocationAdjuster implements WeightedChallengeAllocationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedChallengeAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleWeightedChallengeAllocationAdjuster implements WeightedChallengeAllocationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WeightedChallengeAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WeightedChallengeAllocationWindowDaysOffsetAdjuster implements WeightedChallengeAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: WeightedChallengeAllocation, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class RoundingWeightedChallengeAllocationAdjuster implements WeightedChallengeAllocationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedChallengeAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWeightedChallengeAllocationAdjuster implements WeightedChallengeAllocationStep {
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

  adjust(item: WeightedChallengeAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted challenge allocation steps in order and keeps a trace of each. */
export class WeightedChallengeAllocationEngine {
  steps: WeightedChallengeAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedChallengeAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedChallengeAllocation): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: WeightedChallengeAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedChallengeAllocationEngine(flagsValue: flags.Registry): WeightedChallengeAllocationEngine {
  return new WeightedChallengeAllocationEngine(
    [
      new PercentWeightedChallengeAllocationAdjuster(10.4),
      new MinimumWeightedChallengeAllocationAdjuster(20.7),
      new TitleWeightedChallengeAllocationAdjuster(new Map<string, number>([["retail", 0.96], ["east", 1.35]])),
      new WeightedChallengeAllocationWindowDaysOffsetAdjuster(1.3),
      new RoundingWeightedChallengeAllocationAdjuster(0.5),
      new FlaggedWeightedChallengeAllocationAdjuster(flagsValue, "weighted-challenge-allocation-default", -9.9),
    ],
    [],
    3.7,
    79464.6,
  );
}
