import * as flags from "../../../../kit/flags.js";
import { PrimaryPostSnapshot } from "./primary-post-snapshot.js";

/** One step of the primary post snapshot calculation. */
export interface PrimaryPostSnapshotModifier {
  describe(): string;
  adjust(item: PrimaryPostSnapshot, value: number): number;
}

export class FlaggedPrimaryPostSnapshotAdjuster implements PrimaryPostSnapshotModifier {
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

  adjust(item: PrimaryPostSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryPostSnapshotAdjuster implements PrimaryPostSnapshotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryPostSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelPrimaryPostSnapshotAdjuster implements PrimaryPostSnapshotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PrimaryPostSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PrimaryPostSnapshotCreatedAtOffsetAdjuster implements PrimaryPostSnapshotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: PrimaryPostSnapshot, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the primary post snapshot steps in order and keeps a trace of each. */
export class PrimaryPostSnapshotEngine {
  steps: PrimaryPostSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPostSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryPostSnapshot): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: PrimaryPostSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryPostSnapshotEngine(flagsValue: flags.Registry): PrimaryPostSnapshotEngine {
  return new PrimaryPostSnapshotEngine(
    [
      new FlaggedPrimaryPostSnapshotAdjuster(flagsValue, "primary-post-snapshot-primary", 8),
      new CapPrimaryPostSnapshotAdjuster(43080),
      new LabelPrimaryPostSnapshotAdjuster(new Map<string, number>([["north", 1.05]])),
      new PrimaryPostSnapshotCreatedAtOffsetAdjuster(1.36),
    ],
    [],
    1.6,
    74732.8,
  );
}
