import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalChallengeSnapshot } from "./global-challenge-snapshot.js";

/** One step of the global challenge snapshot calculation. */
export interface GlobalChallengeSnapshotStep {
  describe(): string;
  adjust(item: GlobalChallengeSnapshot, value: number): number;
}

export class MinimumGlobalChallengeSnapshotAdjuster implements GlobalChallengeSnapshotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalChallengeSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryGlobalChallengeSnapshotAdjuster implements GlobalChallengeSnapshotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: GlobalChallengeSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentGlobalChallengeSnapshotAdjuster implements GlobalChallengeSnapshotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalChallengeSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalChallengeSnapshotAdjuster implements GlobalChallengeSnapshotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalChallengeSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class GlobalChallengeSnapshotStartsAtOffsetAdjuster implements GlobalChallengeSnapshotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: GlobalChallengeSnapshot, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class FlaggedGlobalChallengeSnapshotAdjuster implements GlobalChallengeSnapshotStep {
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

  adjust(item: GlobalChallengeSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global challenge snapshot steps in order and keeps a trace of each. */
export class GlobalChallengeSnapshotEngine {
  steps: GlobalChallengeSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalChallengeSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalChallengeSnapshot): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: GlobalChallengeSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalChallengeSnapshotEngine(flagsValue: flags.Registry): GlobalChallengeSnapshotEngine {
  return new GlobalChallengeSnapshotEngine(
    [
      new MinimumGlobalChallengeSnapshotAdjuster(27.3),
      new CountryGlobalChallengeSnapshotAdjuster(new Map<string, number>([["central", 0.75]])),
      new PercentGlobalChallengeSnapshotAdjuster(-16.7),
      new CapGlobalChallengeSnapshotAdjuster(47219),
      new GlobalChallengeSnapshotStartsAtOffsetAdjuster(1.4),
      new FlaggedGlobalChallengeSnapshotAdjuster(flagsValue, "global-challenge-snapshot-seasonal", -3.7),
    ],
    [],
    3.3,
    24509.1,
  );
}
