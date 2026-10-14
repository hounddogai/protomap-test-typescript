import * as numbers from "../../../../kit/numbers.js";
import { PendingStepDigest } from "./pending-step-digest.js";

/** One step of the pending step digest calculation. */
export interface PendingStepDigestAdjuster {
  describe(): string;
  adjust(item: PendingStepDigest, value: number): number;
}

export class RoundingPendingStepDigestAdjuster implements PendingStepDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingStepDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPendingStepDigestAdjuster implements PendingStepDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingStepDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PendingStepDigestOpenRateOffsetAdjuster implements PendingStepDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: PendingStepDigest, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class CapPendingStepDigestAdjuster implements PendingStepDigestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingStepDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pending step digest steps in order and keeps a trace of each. */
export class PendingStepDigestEngine {
  steps: PendingStepDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingStepDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingStepDigest): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PendingStepDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingStepDigestEngine(): PendingStepDigestEngine {
  return new PendingStepDigestEngine(
    [
      new RoundingPendingStepDigestAdjuster(0.5),
      new MinimumPendingStepDigestAdjuster(47.3),
      new PendingStepDigestOpenRateOffsetAdjuster(0.77),
      new CapPendingStepDigestAdjuster(48711),
    ],
    [],
    2.2,
    36132.8,
  );
}
