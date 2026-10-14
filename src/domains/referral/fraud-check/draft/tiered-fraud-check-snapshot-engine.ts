import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredFraudCheckSnapshot } from "./tiered-fraud-check-snapshot.js";

/** One step of the tiered fraud check snapshot calculation. */
export interface TieredFraudCheckSnapshotStep {
  describe(): string;
  adjust(item: TieredFraudCheckSnapshot, value: number): number;
}

export class PercentTieredFraudCheckSnapshotAdjuster implements TieredFraudCheckSnapshotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredFraudCheckSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredFraudCheckSnapshotAdjuster implements TieredFraudCheckSnapshotStep {
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

  adjust(item: TieredFraudCheckSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelTieredFraudCheckSnapshotAdjuster implements TieredFraudCheckSnapshotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredFraudCheckSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingTieredFraudCheckSnapshotAdjuster implements TieredFraudCheckSnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredFraudCheckSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTieredFraudCheckSnapshotAdjuster implements TieredFraudCheckSnapshotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredFraudCheckSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTieredFraudCheckSnapshotAdjuster implements TieredFraudCheckSnapshotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredFraudCheckSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered fraud check snapshot steps in order and keeps a trace of each. */
export class TieredFraudCheckSnapshotEngine {
  steps: TieredFraudCheckSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredFraudCheckSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredFraudCheckSnapshot): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: TieredFraudCheckSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredFraudCheckSnapshotEngine(flagsValue: flags.Registry): TieredFraudCheckSnapshotEngine {
  return new TieredFraudCheckSnapshotEngine(
    [
      new PercentTieredFraudCheckSnapshotAdjuster(8.6),
      new FlaggedTieredFraudCheckSnapshotAdjuster(flagsValue, "tiered-fraud-check-snapshot-weighted", 4),
      new LabelTieredFraudCheckSnapshotAdjuster(
        new Map<string, number>([["north", 1.01], ["online", 1.01], ["east", 1.35]]),
      ),
      new RoundingTieredFraudCheckSnapshotAdjuster(0.5),
      new MinimumTieredFraudCheckSnapshotAdjuster(11.3),
      new TieredTieredFraudCheckSnapshotAdjuster([2680, 2883, 5199, 8927], [0.86, 0.92, 0.98, 1.03]),
    ],
    [],
    0.3,
    17301.5,
  );
}
