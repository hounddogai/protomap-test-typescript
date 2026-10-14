import * as numbers from "../../../../kit/numbers.js";
import { WeightedInviteTier } from "./weighted-invite-tier.js";

/** One step of the weighted invite tier calculation. */
export interface WeightedInviteTierStep {
  describe(): string;
  adjust(item: WeightedInviteTier, value: number): number;
}

export class MinimumWeightedInviteTierAdjuster implements WeightedInviteTierStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedInviteTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class WeightedInviteTierBudgetOffsetAdjuster implements WeightedInviteTierStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: WeightedInviteTier, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentWeightedInviteTierAdjuster implements WeightedInviteTierStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedInviteTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted invite tier steps in order and keeps a trace of each. */
export class WeightedInviteTierEngine {
  steps: WeightedInviteTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedInviteTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedInviteTier): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: WeightedInviteTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedInviteTierEngine(): WeightedInviteTierEngine {
  return new WeightedInviteTierEngine(
    [
      new MinimumWeightedInviteTierAdjuster(44.8),
      new WeightedInviteTierBudgetOffsetAdjuster(0.8),
      new PercentWeightedInviteTierAdjuster(14.1),
    ],
    [],
    4.6,
    7979,
  );
}
