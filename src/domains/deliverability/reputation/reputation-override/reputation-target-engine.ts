import { ReputationTarget } from "./reputation-target.js";

/** One step of the reputation target calculation. */
export interface ReputationTargetAdjuster {
  describe(): string;
  adjust(item: ReputationTarget, value: number): number;
}

export class CapReputationTargetAdjuster implements ReputationTargetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentReputationTargetAdjuster implements ReputationTargetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ReputationTargetRetriesOffsetAdjuster implements ReputationTargetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: ReputationTarget, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class MinimumReputationTargetAdjuster implements ReputationTargetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reputation target steps in order and keeps a trace of each. */
export class ReputationTargetEngine {
  steps: ReputationTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReputationTarget): number {
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

  evaluateAll(items: ReputationTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReputationTargetEngine(): ReputationTargetEngine {
  return new ReputationTargetEngine(
    [
      new CapReputationTargetAdjuster(37997),
      new PercentReputationTargetAdjuster(-0.2),
      new ReputationTargetRetriesOffsetAdjuster(1.59),
      new MinimumReputationTargetAdjuster(11.8),
    ],
    [],
    4,
    7934.6,
  );
}
