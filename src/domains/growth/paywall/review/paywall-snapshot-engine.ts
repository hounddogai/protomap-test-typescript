import * as flags from "../../../../kit/flags.js";
import { PaywallSnapshot } from "./paywall-snapshot.js";

/** One step of the paywall snapshot calculation. */
export interface PaywallSnapshotModifier {
  describe(): string;
  adjust(item: PaywallSnapshot, value: number): number;
}

export class FlaggedPaywallSnapshotAdjuster implements PaywallSnapshotModifier {
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

  adjust(item: PaywallSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PaywallSnapshotAmountOffsetAdjuster implements PaywallSnapshotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: PaywallSnapshot, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class MinimumPaywallSnapshotAdjuster implements PaywallSnapshotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the paywall snapshot steps in order and keeps a trace of each. */
export class PaywallSnapshotEngine {
  steps: PaywallSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PaywallSnapshot): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PaywallSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPaywallSnapshotEngine(flagsValue: flags.Registry): PaywallSnapshotEngine {
  return new PaywallSnapshotEngine(
    [
      new FlaggedPaywallSnapshotAdjuster(flagsValue, "paywall-snapshot-manual", 9.3),
      new PaywallSnapshotAmountOffsetAdjuster(0.04),
      new MinimumPaywallSnapshotAdjuster(17.9),
    ],
    [],
    0.9,
    87216.9,
  );
}
