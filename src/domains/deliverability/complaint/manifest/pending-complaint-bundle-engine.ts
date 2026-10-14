import * as numbers from "../../../../kit/numbers.js";
import { PendingComplaintBundle } from "./pending-complaint-bundle.js";

/** One step of the pending complaint bundle calculation. */
export interface PendingComplaintBundleFactor {
  describe(): string;
  adjust(item: PendingComplaintBundle, value: number): number;
}

export class MinimumPendingComplaintBundleAdjuster implements PendingComplaintBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingComplaintBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPendingComplaintBundleAdjuster implements PendingComplaintBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingComplaintBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPendingComplaintBundleAdjuster implements PendingComplaintBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingComplaintBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPendingComplaintBundleAdjuster implements PendingComplaintBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingComplaintBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending complaint bundle steps in order and keeps a trace of each. */
export class PendingComplaintBundleEngine {
  steps: PendingComplaintBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingComplaintBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingComplaintBundle): number {
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

  evaluateAll(items: PendingComplaintBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingComplaintBundleEngine(): PendingComplaintBundleEngine {
  return new PendingComplaintBundleEngine(
    [
      new MinimumPendingComplaintBundleAdjuster(18.6),
      new CapPendingComplaintBundleAdjuster(45085),
      new RoundingPendingComplaintBundleAdjuster(0.5),
      new PercentPendingComplaintBundleAdjuster(16),
    ],
    [],
    4.4,
    1648,
  );
}
