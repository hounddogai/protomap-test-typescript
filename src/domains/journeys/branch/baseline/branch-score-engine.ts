import * as numbers from "../../../../kit/numbers.js";
import { BranchScore } from "./branch-score.js";

/** One step of the branch score calculation. */
export interface BranchScoreFactor {
  describe(): string;
  adjust(item: BranchScore, value: number): number;
}

export class RoundingBranchScoreAdjuster implements BranchScoreFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBranchScoreAdjuster implements BranchScoreFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BranchScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBranchScoreAdjuster implements BranchScoreFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the branch score steps in order and keeps a trace of each. */
export class BranchScoreEngine {
  steps: BranchScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BranchScore): number {
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

  evaluateAll(items: BranchScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBranchScoreEngine(): BranchScoreEngine {
  return new BranchScoreEngine(
    [
      new RoundingBranchScoreAdjuster(0.5),
      new CapBranchScoreAdjuster(7637),
      new PercentBranchScoreAdjuster(24.6),
    ],
    [],
    0.9,
    38353.6,
  );
}
