import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckSnapshot } from "./fraud-check-snapshot.js";

/** One step of the fraud check snapshot calculation. */
export interface FraudCheckSnapshotAdjuster {
  describe(): string;
  adjust(item: FraudCheckSnapshot, value: number): number;
}

export class MinimumFraudCheckSnapshotAdjuster implements FraudCheckSnapshotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFraudCheckSnapshotAdjuster implements FraudCheckSnapshotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFraudCheckSnapshotAdjuster implements FraudCheckSnapshotAdjuster {
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

  adjust(item: FraudCheckSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelFraudCheckSnapshotAdjuster implements FraudCheckSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FraudCheckSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFraudCheckSnapshotAdjuster implements FraudCheckSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fraud check snapshot steps in order and keeps a trace of each. */
export class FraudCheckSnapshotEngine {
  steps: FraudCheckSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FraudCheckSnapshot): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: FraudCheckSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFraudCheckSnapshotEngine(flagsValue: flags.Registry): FraudCheckSnapshotEngine {
  return new FraudCheckSnapshotEngine(
    [
      new MinimumFraudCheckSnapshotAdjuster(25.8),
      new TieredFraudCheckSnapshotAdjuster([1197, 2850, 8332], [0.98, 0.99, 1.14]),
      new FlaggedFraudCheckSnapshotAdjuster(flagsValue, "fraud-check-snapshot-global", 0),
      new ChannelFraudCheckSnapshotAdjuster(new Map<string, number>([["east", 0.79]])),
      new RoundingFraudCheckSnapshotAdjuster(0.1),
    ],
    [],
    4.2,
    55110.5,
  );
}
