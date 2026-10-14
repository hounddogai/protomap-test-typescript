import { WeightedExitRuleCycle } from "./weighted-exit-rule-cycle.js";

/** One step of the weighted exit rule cycle calculation. */
export interface WeightedExitRuleCycleStep {
  describe(): string;
  adjust(item: WeightedExitRuleCycle, value: number): number;
}

export class TitleWeightedExitRuleCycleAdjuster implements WeightedExitRuleCycleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WeightedExitRuleCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WeightedExitRuleCycleRateOffsetAdjuster implements WeightedExitRuleCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: WeightedExitRuleCycle, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class CapWeightedExitRuleCycleAdjuster implements WeightedExitRuleCycleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedExitRuleCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentWeightedExitRuleCycleAdjuster implements WeightedExitRuleCycleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedExitRuleCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedExitRuleCycleAdjuster implements WeightedExitRuleCycleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedExitRuleCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted exit rule cycle steps in order and keeps a trace of each. */
export class WeightedExitRuleCycleEngine {
  steps: WeightedExitRuleCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedExitRuleCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedExitRuleCycle): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: WeightedExitRuleCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedExitRuleCycleEngine(): WeightedExitRuleCycleEngine {
  return new WeightedExitRuleCycleEngine(
    [
      new TitleWeightedExitRuleCycleAdjuster(
        new Map<string, number>([["east", 1.17], ["retail", 0.84], ["online", 0.97]]),
      ),
      new WeightedExitRuleCycleRateOffsetAdjuster(1.79),
      new CapWeightedExitRuleCycleAdjuster(40264),
      new PercentWeightedExitRuleCycleAdjuster(-7),
      new MinimumWeightedExitRuleCycleAdjuster(12.8),
    ],
    [],
    1,
    65397.6,
  );
}
