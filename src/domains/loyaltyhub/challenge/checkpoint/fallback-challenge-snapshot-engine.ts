import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackChallengeSnapshot } from "./fallback-challenge-snapshot.js";

/** One step of the fallback challenge snapshot calculation. */
export interface FallbackChallengeSnapshotFactor {
  describe(): string;
  adjust(item: FallbackChallengeSnapshot, value: number): number;
}

export class FallbackChallengeSnapshotScoreOffsetAdjuster implements FallbackChallengeSnapshotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: FallbackChallengeSnapshot, value: number): number {
    return value + item.score * this.weight;
  }
}

export class MinimumFallbackChallengeSnapshotAdjuster implements FallbackChallengeSnapshotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackChallengeSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFallbackChallengeSnapshotAdjuster implements FallbackChallengeSnapshotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackChallengeSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFallbackChallengeSnapshotAdjuster implements FallbackChallengeSnapshotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackChallengeSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFallbackChallengeSnapshotAdjuster implements FallbackChallengeSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackChallengeSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedFallbackChallengeSnapshotAdjuster implements FallbackChallengeSnapshotFactor {
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

  adjust(item: FallbackChallengeSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback challenge snapshot steps in order and keeps a trace of each. */
export class FallbackChallengeSnapshotEngine {
  steps: FallbackChallengeSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackChallengeSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackChallengeSnapshot): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackChallengeSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackChallengeSnapshotEngine(flagsValue: flags.Registry): FallbackChallengeSnapshotEngine {
  return new FallbackChallengeSnapshotEngine(
    [
      new FallbackChallengeSnapshotScoreOffsetAdjuster(0.84),
      new MinimumFallbackChallengeSnapshotAdjuster(8),
      new TieredFallbackChallengeSnapshotAdjuster([2611, 2778, 4799], [1.14, 1.16, 1.08]),
      new CapFallbackChallengeSnapshotAdjuster(32838),
      new PercentFallbackChallengeSnapshotAdjuster(-24.4),
      new FlaggedFallbackChallengeSnapshotAdjuster(flagsValue, "fallback-challenge-snapshot-default", -3.5),
    ],
    [],
    3,
    71113.5,
  );
}
