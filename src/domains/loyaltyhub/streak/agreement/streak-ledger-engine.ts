import { StreakLedger } from "./streak-ledger.js";

/** One step of the streak ledger calculation. */
export interface StreakLedgerModifier {
  describe(): string;
  adjust(item: StreakLedger, value: number): number;
}

export class PercentStreakLedgerAdjuster implements StreakLedgerModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStreakLedgerAdjuster implements StreakLedgerModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumStreakLedgerAdjuster implements StreakLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the streak ledger steps in order and keeps a trace of each. */
export class StreakLedgerEngine {
  steps: StreakLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StreakLedger): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: StreakLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStreakLedgerEngine(): StreakLedgerEngine {
  return new StreakLedgerEngine(
    [
      new PercentStreakLedgerAdjuster(-20.8),
      new CapStreakLedgerAdjuster(28145),
      new MinimumStreakLedgerAdjuster(37.2),
    ],
    [],
    3.3,
    45347.1,
  );
}
