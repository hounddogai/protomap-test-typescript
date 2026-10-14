import * as numbers from "../../../../kit/numbers.js";
import { PendingStepRollup } from "./pending-step-rollup.js";

/** One step of the pending step rollup calculation. */
export interface PendingStepRollupFactor {
  describe(): string;
  adjust(item: PendingStepRollup, value: number): number;
}

export class PercentPendingStepRollupAdjuster implements PendingStepRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingStepRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingStepRollupAdjuster implements PendingStepRollupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingStepRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPendingStepRollupAdjuster implements PendingStepRollupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingStepRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending step rollup steps in order and keeps a trace of each. */
export class PendingStepRollupEngine {
  steps: PendingStepRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingStepRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingStepRollup): number {
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

  evaluateAll(items: PendingStepRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingStepRollupEngine(): PendingStepRollupEngine {
  return new PendingStepRollupEngine(
    [
      new PercentPendingStepRollupAdjuster(-24.9),
      new CapPendingStepRollupAdjuster(38716),
      new RoundingPendingStepRollupAdjuster(0.5),
    ],
    [],
    4.5,
    33643.1,
  );
}
