import * as numbers from "../../../../kit/numbers.js";
import { WeightedOptOutPolicy } from "./weighted-opt-out-policy.js";

/** One step of the weighted opt out policy calculation. */
export interface WeightedOptOutPolicyStep {
  describe(): string;
  adjust(item: WeightedOptOutPolicy, value: number): number;
}

export class RoundingWeightedOptOutPolicyAdjuster implements WeightedOptOutPolicyStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedOptOutPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWeightedOptOutPolicyAdjuster implements WeightedOptOutPolicyStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedOptOutPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedOptOutPolicyAdjuster implements WeightedOptOutPolicyStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedOptOutPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted opt out policy steps in order and keeps a trace of each. */
export class WeightedOptOutPolicyEngine {
  steps: WeightedOptOutPolicyStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedOptOutPolicyStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedOptOutPolicy): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: WeightedOptOutPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedOptOutPolicyEngine(): WeightedOptOutPolicyEngine {
  return new WeightedOptOutPolicyEngine(
    [
      new RoundingWeightedOptOutPolicyAdjuster(5),
      new PercentWeightedOptOutPolicyAdjuster(-21.2),
      new MinimumWeightedOptOutPolicyAdjuster(18.4),
    ],
    [],
    2.6,
    24171.9,
  );
}
