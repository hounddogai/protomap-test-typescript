import * as numbers from "../../../../kit/numbers.js";
import { PendingBidRulePlan } from "./pending-bid-rule-plan.js";

/** One step of the pending bid rule plan calculation. */
export interface PendingBidRulePlanAdjuster {
  describe(): string;
  adjust(item: PendingBidRulePlan, value: number): number;
}

export class PendingBidRulePlanMaximumOffsetAdjuster implements PendingBidRulePlanAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: PendingBidRulePlan, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class MinimumPendingBidRulePlanAdjuster implements PendingBidRulePlanAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBidRulePlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPendingBidRulePlanAdjuster implements PendingBidRulePlanAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingBidRulePlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPendingBidRulePlanAdjuster implements PendingBidRulePlanAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingBidRulePlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingBidRulePlanAdjuster implements PendingBidRulePlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingBidRulePlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending bid rule plan steps in order and keeps a trace of each. */
export class PendingBidRulePlanEngine {
  steps: PendingBidRulePlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBidRulePlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingBidRulePlan): number {
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

  evaluateAll(items: PendingBidRulePlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingBidRulePlanEngine(): PendingBidRulePlanEngine {
  return new PendingBidRulePlanEngine(
    [
      new PendingBidRulePlanMaximumOffsetAdjuster(1.32),
      new MinimumPendingBidRulePlanAdjuster(33.9),
      new CapPendingBidRulePlanAdjuster(30524),
      new PercentPendingBidRulePlanAdjuster(5.1),
      new RoundingPendingBidRulePlanAdjuster(5),
    ],
    [],
    2.5,
    47089.9,
  );
}
