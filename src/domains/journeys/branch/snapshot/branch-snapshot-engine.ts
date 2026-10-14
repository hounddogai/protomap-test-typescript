import * as flags from "../../../../kit/flags.js";
import { BranchSnapshot } from "./branch-snapshot.js";

/** One step of the branch snapshot calculation. */
export interface BranchSnapshotFactor {
  describe(): string;
  adjust(item: BranchSnapshot, value: number): number;
}

export class ChannelBranchSnapshotAdjuster implements BranchSnapshotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: BranchSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BranchSnapshotPriorityOffsetAdjuster implements BranchSnapshotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: BranchSnapshot, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedBranchSnapshotAdjuster implements BranchSnapshotFactor {
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

  adjust(item: BranchSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the branch snapshot steps in order and keeps a trace of each. */
export class BranchSnapshotEngine {
  steps: BranchSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BranchSnapshot): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: BranchSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBranchSnapshotEngine(flagsValue: flags.Registry): BranchSnapshotEngine {
  return new BranchSnapshotEngine(
    [
      new ChannelBranchSnapshotAdjuster(new Map<string, number>([["north", 1.07]])),
      new BranchSnapshotPriorityOffsetAdjuster(1.2),
      new FlaggedBranchSnapshotAdjuster(flagsValue, "branch-snapshot-manual", 7.6),
    ],
    [],
    4.5,
    27266,
  );
}
