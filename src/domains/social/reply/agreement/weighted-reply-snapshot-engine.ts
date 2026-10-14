import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedReplySnapshot } from "./weighted-reply-snapshot.js";

/** One step of the weighted reply snapshot calculation. */
export interface WeightedReplySnapshotModifier {
  describe(): string;
  adjust(item: WeightedReplySnapshot, value: number): number;
}

export class RoundingWeightedReplySnapshotAdjuster implements WeightedReplySnapshotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedReplySnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentWeightedReplySnapshotAdjuster implements WeightedReplySnapshotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: WeightedReplySnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWeightedReplySnapshotAdjuster implements WeightedReplySnapshotModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: WeightedReplySnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedReplySnapshotAdjuster implements WeightedReplySnapshotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedReplySnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumWeightedReplySnapshotAdjuster implements WeightedReplySnapshotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedReplySnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted reply snapshot steps in order and keeps a trace of each. */
export class WeightedReplySnapshotEngine {
  steps: WeightedReplySnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedReplySnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedReplySnapshot): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: WeightedReplySnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedReplySnapshotEngine(flagsValue: flags.Registry): WeightedReplySnapshotEngine {
  return new WeightedReplySnapshotEngine(
    [
      new RoundingWeightedReplySnapshotAdjuster(0.25),
      new SegmentWeightedReplySnapshotAdjuster(new Map<string, number>([["east", 0.71], ["retail", 1.28]])),
      new FlaggedWeightedReplySnapshotAdjuster(flagsValue, "weighted-reply-snapshot-seasonal", -8.3),
      new TieredWeightedReplySnapshotAdjuster([622, 7740, 8160], [1.19, 1.1, 0.86]),
      new MinimumWeightedReplySnapshotAdjuster(10.2),
    ],
    [],
    4.1,
    22558.8,
  );
}
