import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalPaywallSnapshot } from "./regional-paywall-snapshot.js";

/** One step of the regional paywall snapshot calculation. */
export interface RegionalPaywallSnapshotAdjuster {
  describe(): string;
  adjust(item: RegionalPaywallSnapshot, value: number): number;
}

export class PercentRegionalPaywallSnapshotAdjuster implements RegionalPaywallSnapshotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalPaywallSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRegionalPaywallSnapshotAdjuster implements RegionalPaywallSnapshotAdjuster {
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

  adjust(item: RegionalPaywallSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelRegionalPaywallSnapshotAdjuster implements RegionalPaywallSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalPaywallSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RegionalPaywallSnapshotSendAtOffsetAdjuster implements RegionalPaywallSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: RegionalPaywallSnapshot, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class RoundingRegionalPaywallSnapshotAdjuster implements RegionalPaywallSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalPaywallSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional paywall snapshot steps in order and keeps a trace of each. */
export class RegionalPaywallSnapshotEngine {
  steps: RegionalPaywallSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPaywallSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalPaywallSnapshot): number {
    let current = item.netVolume();
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

  evaluateAll(items: RegionalPaywallSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalPaywallSnapshotEngine(flagsValue: flags.Registry): RegionalPaywallSnapshotEngine {
  return new RegionalPaywallSnapshotEngine(
    [
      new PercentRegionalPaywallSnapshotAdjuster(-1.1),
      new FlaggedRegionalPaywallSnapshotAdjuster(flagsValue, "regional-paywall-snapshot-rolling", -6.7),
      new LabelRegionalPaywallSnapshotAdjuster(new Map<string, number>([["online", 0.82], ["west", 0.94]])),
      new RegionalPaywallSnapshotSendAtOffsetAdjuster(1.8),
      new RoundingRegionalPaywallSnapshotAdjuster(1),
    ],
    [],
    1.3,
    64416.5,
  );
}
