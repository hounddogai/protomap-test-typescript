import * as numbers from "../../../../kit/numbers.js";
import { PrimaryApprovalSnapshot } from "./primary-approval-snapshot.js";

/** One step of the primary approval snapshot calculation. */
export interface PrimaryApprovalSnapshotModifier {
  describe(): string;
  adjust(item: PrimaryApprovalSnapshot, value: number): number;
}

export class TitlePrimaryApprovalSnapshotAdjuster implements PrimaryApprovalSnapshotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PrimaryApprovalSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPrimaryApprovalSnapshotAdjuster implements PrimaryApprovalSnapshotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryApprovalSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPrimaryApprovalSnapshotAdjuster implements PrimaryApprovalSnapshotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryApprovalSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPrimaryApprovalSnapshotAdjuster implements PrimaryApprovalSnapshotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryApprovalSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary approval snapshot steps in order and keeps a trace of each. */
export class PrimaryApprovalSnapshotEngine {
  steps: PrimaryApprovalSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryApprovalSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryApprovalSnapshot): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PrimaryApprovalSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryApprovalSnapshotEngine(): PrimaryApprovalSnapshotEngine {
  return new PrimaryApprovalSnapshotEngine(
    [
      new TitlePrimaryApprovalSnapshotAdjuster(new Map<string, number>([["south", 1.33], ["east", 1.07]])),
      new CapPrimaryApprovalSnapshotAdjuster(1113),
      new MinimumPrimaryApprovalSnapshotAdjuster(46.4),
      new PercentPrimaryApprovalSnapshotAdjuster(-17.3),
    ],
    [],
    4.4,
    85636.5,
  );
}
