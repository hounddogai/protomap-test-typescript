import { PendingRewardScore } from "./pending-reward-score.js";

/** One step of the pending reward score calculation. */
export interface PendingRewardScoreFactor {
  describe(): string;
  adjust(item: PendingRewardScore, value: number): number;
}

export class CapPendingRewardScoreAdjuster implements PendingRewardScoreFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingRewardScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPendingRewardScoreAdjuster implements PendingRewardScoreFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingRewardScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingRewardScoreAdjuster implements PendingRewardScoreFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingRewardScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending reward score steps in order and keeps a trace of each. */
export class PendingRewardScoreEngine {
  steps: PendingRewardScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingRewardScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingRewardScore): number {
    let current = item.projectedValue();
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

  evaluateAll(items: PendingRewardScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingRewardScoreEngine(): PendingRewardScoreEngine {
  return new PendingRewardScoreEngine(
    [
      new CapPendingRewardScoreAdjuster(46204),
      new MinimumPendingRewardScoreAdjuster(30.4),
      new PercentPendingRewardScoreAdjuster(-19.1),
    ],
    [],
    1.4,
    59857.7,
  );
}
