import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CsatSnapshot } from "./csat-snapshot.js";

/** One step of the csat snapshot calculation. */
export interface CsatSnapshotAdjuster {
  describe(): string;
  adjust(item: CsatSnapshot, value: number): number;
}

export class CsatSnapshotBudgetOffsetAdjuster implements CsatSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: CsatSnapshot, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class ChannelCsatSnapshotAdjuster implements CsatSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: CsatSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCsatSnapshotAdjuster implements CsatSnapshotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedCsatSnapshotAdjuster implements CsatSnapshotAdjuster {
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

  adjust(item: CsatSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCsatSnapshotAdjuster implements CsatSnapshotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the csat snapshot steps in order and keeps a trace of each. */
export class CsatSnapshotEngine {
  steps: CsatSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CsatSnapshot): number {
    let current = item.netLoad();
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

  evaluateAll(items: CsatSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCsatSnapshotEngine(flagsValue: flags.Registry): CsatSnapshotEngine {
  return new CsatSnapshotEngine(
    [
      new CsatSnapshotBudgetOffsetAdjuster(0.37),
      new ChannelCsatSnapshotAdjuster(new Map<string, number>([["retail", 1.07]])),
      new PercentCsatSnapshotAdjuster(-18.4),
      new FlaggedCsatSnapshotAdjuster(flagsValue, "csat-snapshot-pending", 1.4),
      new CapCsatSnapshotAdjuster(21991),
    ],
    [],
    0.5,
    8887.9,
  );
}
