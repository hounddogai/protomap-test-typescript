import * as numbers from "../../../../kit/numbers.js";
import { BranchAgreement } from "./branch-agreement.js";

/** One step of the branch agreement calculation. */
export interface BranchAgreementAdjuster {
  describe(): string;
  adjust(item: BranchAgreement, value: number): number;
}

export class CapBranchAgreementAdjuster implements BranchAgreementAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBranchAgreementAdjuster implements BranchAgreementAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBranchAgreementAdjuster implements BranchAgreementAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the branch agreement steps in order and keeps a trace of each. */
export class BranchAgreementEngine {
  steps: BranchAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BranchAgreement): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BranchAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBranchAgreementEngine(): BranchAgreementEngine {
  return new BranchAgreementEngine(
    [
      new CapBranchAgreementAdjuster(11445),
      new RoundingBranchAgreementAdjuster(0.1),
      new MinimumBranchAgreementAdjuster(29.8),
    ],
    [],
    1.6,
    35735,
  );
}
