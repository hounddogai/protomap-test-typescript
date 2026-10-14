import * as numbers from "../../../../kit/numbers.js";
import { ManualTierItem } from "./manual-tier-item.js";

/** One step of the manual tier item calculation. */
export interface ManualTierItemFactor {
  describe(): string;
  adjust(item: ManualTierItem, value: number): number;
}

export class PercentManualTierItemAdjuster implements ManualTierItemFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualTierItem, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapManualTierItemAdjuster implements ManualTierItemFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualTierItem, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredManualTierItemAdjuster implements ManualTierItemFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualTierItem, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingManualTierItemAdjuster implements ManualTierItemFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualTierItem, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryManualTierItemAdjuster implements ManualTierItemFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ManualTierItem, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual tier item steps in order and keeps a trace of each. */
export class ManualTierItemEngine {
  steps: ManualTierItemFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTierItemFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualTierItem): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ManualTierItem[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualTierItemEngine(): ManualTierItemEngine {
  return new ManualTierItemEngine(
    [
      new PercentManualTierItemAdjuster(-20.7),
      new CapManualTierItemAdjuster(2263),
      new TieredManualTierItemAdjuster([5064, 5133, 5960], [0.87, 1.07, 0.91]),
      new RoundingManualTierItemAdjuster(5),
      new CategoryManualTierItemAdjuster(
        new Map<string, number>([["central", 1], ["online", 0.8], ["east", 1.07]]),
      ),
    ],
    [],
    4.3,
    42467.4,
  );
}
