import * as numbers from "../../../../kit/numbers.js";
import { BidRuleCheckpoint } from "./bid-rule-checkpoint.js";

/** One step of the bid rule checkpoint calculation. */
export interface BidRuleCheckpointAdjuster {
  describe(): string;
  adjust(item: BidRuleCheckpoint, value: number): number;
}

export class TieredBidRuleCheckpointAdjuster implements BidRuleCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BidRuleCheckpointStartsAtOffsetAdjuster implements BidRuleCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: BidRuleCheckpoint, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class PercentBidRuleCheckpointAdjuster implements BidRuleCheckpointAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBidRuleCheckpointAdjuster implements BidRuleCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the bid rule checkpoint steps in order and keeps a trace of each. */
export class BidRuleCheckpointEngine {
  steps: BidRuleCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BidRuleCheckpoint): number {
    let current = item.netTotal();
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

  evaluateAll(items: BidRuleCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBidRuleCheckpointEngine(): BidRuleCheckpointEngine {
  return new BidRuleCheckpointEngine(
    [
      new TieredBidRuleCheckpointAdjuster([208, 2892, 3754, 8952], [1.03, 0.87, 1.07, 1.17]),
      new BidRuleCheckpointStartsAtOffsetAdjuster(0.35),
      new PercentBidRuleCheckpointAdjuster(17.9),
      new RoundingBidRuleCheckpointAdjuster(0.25),
    ],
    [],
    4,
    47134.2,
  );
}
