import * as numbers from "../../../../kit/numbers.js";
import { TieredWindowMilestone } from "./tiered-window-milestone.js";

/** One step of the tiered window milestone calculation. */
export interface TieredWindowMilestoneModifier {
  describe(): string;
  adjust(item: TieredWindowMilestone, value: number): number;
}

export class RoundingTieredWindowMilestoneAdjuster implements TieredWindowMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredWindowMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredWindowMilestoneDiscountOffsetAdjuster implements TieredWindowMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: TieredWindowMilestone, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class MinimumTieredWindowMilestoneAdjuster implements TieredWindowMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredWindowMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered window milestone steps in order and keeps a trace of each. */
export class TieredWindowMilestoneEngine {
  steps: TieredWindowMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredWindowMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredWindowMilestone): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: TieredWindowMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredWindowMilestoneEngine(): TieredWindowMilestoneEngine {
  return new TieredWindowMilestoneEngine(
    [
      new RoundingTieredWindowMilestoneAdjuster(0.05),
      new TieredWindowMilestoneDiscountOffsetAdjuster(1.69),
      new MinimumTieredWindowMilestoneAdjuster(6.8),
    ],
    [],
    0.7,
    68992.9,
  );
}
