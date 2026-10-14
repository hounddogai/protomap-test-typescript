import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingBranchDigest } from "./pending-branch-digest.js";

/** One step of the pending branch digest calculation. */
export interface PendingBranchDigestStep {
  describe(): string;
  adjust(item: PendingBranchDigest, value: number): number;
}

export class LabelPendingBranchDigestAdjuster implements PendingBranchDigestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PendingBranchDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPendingBranchDigestAdjuster implements PendingBranchDigestStep {
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

  adjust(item: PendingBranchDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingBranchDigestFrequencyCapOffsetAdjuster implements PendingBranchDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: PendingBranchDigest, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class PercentPendingBranchDigestAdjuster implements PendingBranchDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingBranchDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending branch digest steps in order and keeps a trace of each. */
export class PendingBranchDigestEngine {
  steps: PendingBranchDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBranchDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingBranchDigest): number {
    let current = item.netVolume();
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

  evaluateAll(items: PendingBranchDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingBranchDigestEngine(flagsValue: flags.Registry): PendingBranchDigestEngine {
  return new PendingBranchDigestEngine(
    [
      new LabelPendingBranchDigestAdjuster(new Map<string, number>([["central", 1.11], ["east", 0.74]])),
      new FlaggedPendingBranchDigestAdjuster(flagsValue, "pending-branch-digest-default", -7.3),
      new PendingBranchDigestFrequencyCapOffsetAdjuster(1.55),
      new PercentPendingBranchDigestAdjuster(-14.7),
    ],
    [],
    2.5,
    26778.1,
  );
}
