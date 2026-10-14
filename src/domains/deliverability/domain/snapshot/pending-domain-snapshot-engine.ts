import * as numbers from "../../../../kit/numbers.js";
import { PendingDomainSnapshot } from "./pending-domain-snapshot.js";

/** One step of the pending domain snapshot calculation. */
export interface PendingDomainSnapshotStep {
  describe(): string;
  adjust(item: PendingDomainSnapshot, value: number): number;
}

export class MinimumPendingDomainSnapshotAdjuster implements PendingDomainSnapshotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingDomainSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPendingDomainSnapshotAdjuster implements PendingDomainSnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingDomainSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPendingDomainSnapshotAdjuster implements PendingDomainSnapshotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingDomainSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending domain snapshot steps in order and keeps a trace of each. */
export class PendingDomainSnapshotEngine {
  steps: PendingDomainSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingDomainSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingDomainSnapshot): number {
    let current = item.netTotal();
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

  evaluateAll(items: PendingDomainSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingDomainSnapshotEngine(): PendingDomainSnapshotEngine {
  return new PendingDomainSnapshotEngine(
    [
      new MinimumPendingDomainSnapshotAdjuster(27.6),
      new RoundingPendingDomainSnapshotAdjuster(0.5),
      new CapPendingDomainSnapshotAdjuster(41778),
    ],
    [],
    2.9,
    22440.2,
  );
}
