import * as flags from "../../../../kit/flags.js";
import { ManualPostSnapshot } from "./manual-post-snapshot.js";

/** One step of the manual post snapshot calculation. */
export interface ManualPostSnapshotModifier {
  describe(): string;
  adjust(item: ManualPostSnapshot, value: number): number;
}

export class FlaggedManualPostSnapshotAdjuster implements ManualPostSnapshotModifier {
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

  adjust(item: ManualPostSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualPostSnapshotAdjuster implements ManualPostSnapshotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualPostSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ManualPostSnapshotAttemptsOffsetAdjuster implements ManualPostSnapshotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: ManualPostSnapshot, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class CapManualPostSnapshotAdjuster implements ManualPostSnapshotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualPostSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualPostSnapshotAdjuster implements ManualPostSnapshotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualPostSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual post snapshot steps in order and keeps a trace of each. */
export class ManualPostSnapshotEngine {
  steps: ManualPostSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPostSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualPostSnapshot): number {
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

  evaluateAll(items: ManualPostSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualPostSnapshotEngine(flagsValue: flags.Registry): ManualPostSnapshotEngine {
  return new ManualPostSnapshotEngine(
    [
      new FlaggedManualPostSnapshotAdjuster(flagsValue, "manual-post-snapshot-strict", -7.8),
      new TieredManualPostSnapshotAdjuster([1861, 2760, 5804, 5995], [1.07, 0.85, 1.12, 1.04]),
      new ManualPostSnapshotAttemptsOffsetAdjuster(0.95),
      new CapManualPostSnapshotAdjuster(4821),
      new MinimumManualPostSnapshotAdjuster(30.3),
    ],
    [],
    4.3,
    41851.8,
  );
}
