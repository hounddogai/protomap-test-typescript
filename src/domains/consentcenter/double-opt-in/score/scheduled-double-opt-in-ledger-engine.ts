import * as numbers from "../../../../kit/numbers.js";
import { ScheduledDoubleOptInLedger } from "./scheduled-double-opt-in-ledger.js";

/** One step of the scheduled double opt in ledger calculation. */
export interface ScheduledDoubleOptInLedgerModifier {
  describe(): string;
  adjust(item: ScheduledDoubleOptInLedger, value: number): number;
}

export class CapScheduledDoubleOptInLedgerAdjuster implements ScheduledDoubleOptInLedgerModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledDoubleOptInLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingScheduledDoubleOptInLedgerAdjuster implements ScheduledDoubleOptInLedgerModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledDoubleOptInLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumScheduledDoubleOptInLedgerAdjuster implements ScheduledDoubleOptInLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledDoubleOptInLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled double opt in ledger steps in order and keeps a trace of each. */
export class ScheduledDoubleOptInLedgerEngine {
  steps: ScheduledDoubleOptInLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledDoubleOptInLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledDoubleOptInLedger): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ScheduledDoubleOptInLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledDoubleOptInLedgerEngine(): ScheduledDoubleOptInLedgerEngine {
  return new ScheduledDoubleOptInLedgerEngine(
    [
      new CapScheduledDoubleOptInLedgerAdjuster(28734),
      new RoundingScheduledDoubleOptInLedgerAdjuster(0.5),
      new MinimumScheduledDoubleOptInLedgerAdjuster(3.3),
    ],
    [],
    1.8,
    94541.3,
  );
}
