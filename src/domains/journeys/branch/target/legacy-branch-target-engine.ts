import * as numbers from "../../../../kit/numbers.js";
import { LegacyBranchTarget } from "./legacy-branch-target.js";

/** One step of the legacy branch target calculation. */
export interface LegacyBranchTargetAdjuster {
  describe(): string;
  adjust(item: LegacyBranchTarget, value: number): number;
}

export class MinimumLegacyBranchTargetAdjuster implements LegacyBranchTargetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyBranchTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyBranchTargetAdjuster implements LegacyBranchTargetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyBranchTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLegacyBranchTargetAdjuster implements LegacyBranchTargetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyBranchTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy branch target steps in order and keeps a trace of each. */
export class LegacyBranchTargetEngine {
  steps: LegacyBranchTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyBranchTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyBranchTarget): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LegacyBranchTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyBranchTargetEngine(): LegacyBranchTargetEngine {
  return new LegacyBranchTargetEngine(
    [
      new MinimumLegacyBranchTargetAdjuster(16),
      new RoundingLegacyBranchTargetAdjuster(0.25),
      new CapLegacyBranchTargetAdjuster(6613),
    ],
    [],
    4.8,
    91324.9,
  );
}
