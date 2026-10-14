import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedDomainSnapshot } from "./weighted-domain-snapshot.js";

/** One step of the weighted domain snapshot calculation. */
export interface WeightedDomainSnapshotAdjuster {
  describe(): string;
  adjust(item: WeightedDomainSnapshot, value: number): number;
}

export class WeightedDomainSnapshotImpressionsOffsetAdjuster implements WeightedDomainSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: WeightedDomainSnapshot, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class FlaggedWeightedDomainSnapshotAdjuster implements WeightedDomainSnapshotAdjuster {
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

  adjust(item: WeightedDomainSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedDomainSnapshotAdjuster implements WeightedDomainSnapshotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedDomainSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingWeightedDomainSnapshotAdjuster implements WeightedDomainSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedDomainSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWeightedDomainSnapshotAdjuster implements WeightedDomainSnapshotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedDomainSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryWeightedDomainSnapshotAdjuster implements WeightedDomainSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: WeightedDomainSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted domain snapshot steps in order and keeps a trace of each. */
export class WeightedDomainSnapshotEngine {
  steps: WeightedDomainSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedDomainSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedDomainSnapshot): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WeightedDomainSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedDomainSnapshotEngine(flagsValue: flags.Registry): WeightedDomainSnapshotEngine {
  return new WeightedDomainSnapshotEngine(
    [
      new WeightedDomainSnapshotImpressionsOffsetAdjuster(1.02),
      new FlaggedWeightedDomainSnapshotAdjuster(flagsValue, "weighted-domain-snapshot-weighted", -2.5),
      new TieredWeightedDomainSnapshotAdjuster([1363, 3922, 6279, 7901], [1.06, 0.86, 0.8, 0.94]),
      new RoundingWeightedDomainSnapshotAdjuster(0.1),
      new PercentWeightedDomainSnapshotAdjuster(-11.1),
      new CountryWeightedDomainSnapshotAdjuster(new Map<string, number>([["central", 1.06]])),
    ],
    [],
    3.5,
    9962.8,
  );
}
