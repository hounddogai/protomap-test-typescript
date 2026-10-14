import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionSnapshot } from "./subscription-snapshot.js";

/** One step of the subscription snapshot calculation. */
export interface SubscriptionSnapshotStep {
  describe(): string;
  adjust(item: SubscriptionSnapshot, value: number): number;
}

export class TieredSubscriptionSnapshotAdjuster implements SubscriptionSnapshotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SubscriptionSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentSubscriptionSnapshotAdjuster implements SubscriptionSnapshotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedSubscriptionSnapshotAdjuster implements SubscriptionSnapshotStep {
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

  adjust(item: SubscriptionSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapSubscriptionSnapshotAdjuster implements SubscriptionSnapshotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSubscriptionSnapshotAdjuster implements SubscriptionSnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SubscriptionSnapshotWindowDaysOffsetAdjuster implements SubscriptionSnapshotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: SubscriptionSnapshot, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the subscription snapshot steps in order and keeps a trace of each. */
export class SubscriptionSnapshotEngine {
  steps: SubscriptionSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SubscriptionSnapshot): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: SubscriptionSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSubscriptionSnapshotEngine(flagsValue: flags.Registry): SubscriptionSnapshotEngine {
  return new SubscriptionSnapshotEngine(
    [
      new TieredSubscriptionSnapshotAdjuster([4736, 9720], [0.99, 0.99]),
      new PercentSubscriptionSnapshotAdjuster(-11.1),
      new FlaggedSubscriptionSnapshotAdjuster(flagsValue, "subscription-snapshot-capped", -4.3),
      new CapSubscriptionSnapshotAdjuster(41798),
      new RoundingSubscriptionSnapshotAdjuster(5),
      new SubscriptionSnapshotWindowDaysOffsetAdjuster(0.03),
    ],
    [],
    2.1,
    27960.2,
  );
}
