import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryActivationSnapshot } from "./primary-activation-snapshot.js";

/** One step of the primary activation snapshot calculation. */
export interface PrimaryActivationSnapshotFactor {
  describe(): string;
  adjust(item: PrimaryActivationSnapshot, value: number): number;
}

export class RoundingPrimaryActivationSnapshotAdjuster implements PrimaryActivationSnapshotFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryActivationSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPrimaryActivationSnapshotAdjuster implements PrimaryActivationSnapshotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryActivationSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPrimaryActivationSnapshotAdjuster implements PrimaryActivationSnapshotFactor {
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

  adjust(item: PrimaryActivationSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryActivationSnapshotOpenRateOffsetAdjuster implements PrimaryActivationSnapshotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: PrimaryActivationSnapshot, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class MinimumPrimaryActivationSnapshotAdjuster implements PrimaryActivationSnapshotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryActivationSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocalePrimaryActivationSnapshotAdjuster implements PrimaryActivationSnapshotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PrimaryActivationSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary activation snapshot steps in order and keeps a trace of each. */
export class PrimaryActivationSnapshotEngine {
  steps: PrimaryActivationSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryActivationSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryActivationSnapshot): number {
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

  evaluateAll(items: PrimaryActivationSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryActivationSnapshotEngine(flagsValue: flags.Registry): PrimaryActivationSnapshotEngine {
  return new PrimaryActivationSnapshotEngine(
    [
      new RoundingPrimaryActivationSnapshotAdjuster(5),
      new TieredPrimaryActivationSnapshotAdjuster([1445, 5439, 6046, 6159], [0.92, 0.91, 1.06, 1.2]),
      new FlaggedPrimaryActivationSnapshotAdjuster(flagsValue, "primary-activation-snapshot-batched", 7.6),
      new PrimaryActivationSnapshotOpenRateOffsetAdjuster(0.91),
      new MinimumPrimaryActivationSnapshotAdjuster(6.2),
      new LocalePrimaryActivationSnapshotAdjuster(new Map<string, number>([["east", 1.03]])),
    ],
    [],
    4.1,
    25803.1,
  );
}
