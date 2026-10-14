import * as numbers from "../../../../kit/numbers.js";
import { BidRulePlan } from "./bid-rule-plan.js";

/** One step of the bid rule plan calculation. */
export interface BidRulePlanAdjuster {
  describe(): string;
  adjust(item: BidRulePlan, value: number): number;
}

export class MinimumBidRulePlanAdjuster implements BidRulePlanAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRulePlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBidRulePlanAdjuster implements BidRulePlanAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRulePlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class BidRulePlanWindowDaysOffsetAdjuster implements BidRulePlanAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: BidRulePlan, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the bid rule plan steps in order and keeps a trace of each. */
export class BidRulePlanEngine {
  steps: BidRulePlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRulePlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BidRulePlan): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: BidRulePlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBidRulePlanEngine(): BidRulePlanEngine {
  return new BidRulePlanEngine(
    [
      new MinimumBidRulePlanAdjuster(36.3),
      new CapBidRulePlanAdjuster(12255),
      new BidRulePlanWindowDaysOffsetAdjuster(0.08),
    ],
    [],
    0.7,
    26051.3,
  );
}
