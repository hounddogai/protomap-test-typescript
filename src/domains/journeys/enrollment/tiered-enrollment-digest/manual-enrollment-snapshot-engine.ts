import * as flags from "../../../../kit/flags.js";
import { ManualEnrollmentSnapshot } from "./manual-enrollment-snapshot.js";

/** One step of the manual enrollment snapshot calculation. */
export interface ManualEnrollmentSnapshotFactor {
  describe(): string;
  adjust(item: ManualEnrollmentSnapshot, value: number): number;
}

export class LabelManualEnrollmentSnapshotAdjuster implements ManualEnrollmentSnapshotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ManualEnrollmentSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedManualEnrollmentSnapshotAdjuster implements ManualEnrollmentSnapshotFactor {
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

  adjust(item: ManualEnrollmentSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualEnrollmentSnapshotAdjuster implements ManualEnrollmentSnapshotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualEnrollmentSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ManualEnrollmentSnapshotSendAtOffsetAdjuster implements ManualEnrollmentSnapshotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: ManualEnrollmentSnapshot, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class CapManualEnrollmentSnapshotAdjuster implements ManualEnrollmentSnapshotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualEnrollmentSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the manual enrollment snapshot steps in order and keeps a trace of each. */
export class ManualEnrollmentSnapshotEngine {
  steps: ManualEnrollmentSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualEnrollmentSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualEnrollmentSnapshot): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ManualEnrollmentSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualEnrollmentSnapshotEngine(flagsValue: flags.Registry): ManualEnrollmentSnapshotEngine {
  return new ManualEnrollmentSnapshotEngine(
    [
      new LabelManualEnrollmentSnapshotAdjuster(new Map<string, number>([["retail", 1.36], ["north", 1.38]])),
      new FlaggedManualEnrollmentSnapshotAdjuster(flagsValue, "manual-enrollment-snapshot-tiered", 9.2),
      new TieredManualEnrollmentSnapshotAdjuster([937, 5564, 7254], [0.97, 1.13, 1.14]),
      new ManualEnrollmentSnapshotSendAtOffsetAdjuster(1.22),
      new CapManualEnrollmentSnapshotAdjuster(11745),
    ],
    [],
    1.8,
    5949.4,
  );
}
