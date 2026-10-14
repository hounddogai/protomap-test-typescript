import * as flags from "../../../../kit/flags.js";
import { PendingApprovalBundle } from "./pending-approval-bundle.js";

/** One step of the pending approval bundle calculation. */
export interface PendingApprovalBundleAdjuster {
  describe(): string;
  adjust(item: PendingApprovalBundle, value: number): number;
}

export class TieredPendingApprovalBundleAdjuster implements PendingApprovalBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingApprovalBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPendingApprovalBundleAdjuster implements PendingApprovalBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingApprovalBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingApprovalBundleAdjuster implements PendingApprovalBundleAdjuster {
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

  adjust(item: PendingApprovalBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingApprovalBundleScoreOffsetAdjuster implements PendingApprovalBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: PendingApprovalBundle, value: number): number {
    return value + item.score * this.weight;
  }
}

export class TitlePendingApprovalBundleAdjuster implements PendingApprovalBundleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PendingApprovalBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending approval bundle steps in order and keeps a trace of each. */
export class PendingApprovalBundleEngine {
  steps: PendingApprovalBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingApprovalBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingApprovalBundle): number {
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

  evaluateAll(items: PendingApprovalBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingApprovalBundleEngine(flagsValue: flags.Registry): PendingApprovalBundleEngine {
  return new PendingApprovalBundleEngine(
    [
      new TieredPendingApprovalBundleAdjuster([3838, 5741, 6845, 9333], [0.99, 1.03, 0.84, 0.99]),
      new CapPendingApprovalBundleAdjuster(39024),
      new FlaggedPendingApprovalBundleAdjuster(flagsValue, "pending-approval-bundle-legacy", -1.3),
      new PendingApprovalBundleScoreOffsetAdjuster(0.91),
      new TitlePendingApprovalBundleAdjuster(new Map<string, number>([["online", 0.76]])),
    ],
    [],
    0.8,
    62100.6,
  );
}
