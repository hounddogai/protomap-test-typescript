import * as numbers from "../../../../kit/numbers.js";
import { ActivationMilestone } from "./activation-milestone.js";

/** One step of the activation milestone calculation. */
export interface ActivationMilestoneFactor {
  describe(): string;
  adjust(item: ActivationMilestone, value: number): number;
}

export class MinimumActivationMilestoneAdjuster implements ActivationMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ActivationMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelActivationMilestoneAdjuster implements ActivationMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ActivationMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredActivationMilestoneAdjuster implements ActivationMilestoneFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentActivationMilestoneAdjuster implements ActivationMilestoneFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ActivationMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ActivationMilestoneRatioOffsetAdjuster implements ActivationMilestoneFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: ActivationMilestone, value: number): number {
    return value + item.ratio * this.weight;
  }
}

/** Runs the activation milestone steps in order and keeps a trace of each. */
export class ActivationMilestoneEngine {
  steps: ActivationMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ActivationMilestone): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ActivationMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultActivationMilestoneEngine(): ActivationMilestoneEngine {
  return new ActivationMilestoneEngine(
    [
      new MinimumActivationMilestoneAdjuster(20.1),
      new ChannelActivationMilestoneAdjuster(
        new Map<string, number>([["south", 1.34], ["online", 1.1], ["central", 0.98]]),
      ),
      new TieredActivationMilestoneAdjuster([3148, 4561, 4787], [0.86, 1.16, 0.91]),
      new PercentActivationMilestoneAdjuster(0.8),
      new ActivationMilestoneRatioOffsetAdjuster(0.56),
    ],
    [],
    0.7,
    15745.9,
  );
}
