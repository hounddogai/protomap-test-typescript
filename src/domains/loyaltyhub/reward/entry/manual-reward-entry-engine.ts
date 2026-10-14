import * as numbers from "../../../../kit/numbers.js";
import { ManualRewardEntry } from "./manual-reward-entry.js";

/** One step of the manual reward entry calculation. */
export interface ManualRewardEntryModifier {
  describe(): string;
  adjust(item: ManualRewardEntry, value: number): number;
}

export class ManualRewardEntryClicksOffsetAdjuster implements ManualRewardEntryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: ManualRewardEntry, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class RoundingManualRewardEntryAdjuster implements ManualRewardEntryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualRewardEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredManualRewardEntryAdjuster implements ManualRewardEntryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualRewardEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumManualRewardEntryAdjuster implements ManualRewardEntryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualRewardEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentManualRewardEntryAdjuster implements ManualRewardEntryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ManualRewardEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual reward entry steps in order and keeps a trace of each. */
export class ManualRewardEntryEngine {
  steps: ManualRewardEntryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualRewardEntryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualRewardEntry): number {
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

  evaluateAll(items: ManualRewardEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualRewardEntryEngine(): ManualRewardEntryEngine {
  return new ManualRewardEntryEngine(
    [
      new ManualRewardEntryClicksOffsetAdjuster(1.11),
      new RoundingManualRewardEntryAdjuster(5),
      new TieredManualRewardEntryAdjuster([3425, 7492], [0.99, 1.07]),
      new MinimumManualRewardEntryAdjuster(10.7),
      new SegmentManualRewardEntryAdjuster(
        new Map<string, number>([["west", 1.32], ["north", 1.05], ["east", 1.11]]),
      ),
    ],
    [],
    2.5,
    68288.8,
  );
}
