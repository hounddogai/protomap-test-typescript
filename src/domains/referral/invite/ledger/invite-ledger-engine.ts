import * as numbers from "../../../../kit/numbers.js";
import { InviteLedger } from "./invite-ledger.js";

/** One step of the invite ledger calculation. */
export interface InviteLedgerStep {
  describe(): string;
  adjust(item: InviteLedger, value: number): number;
}

export class PercentInviteLedgerAdjuster implements InviteLedgerStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingInviteLedgerAdjuster implements InviteLedgerStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleInviteLedgerAdjuster implements InviteLedgerStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: InviteLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumInviteLedgerAdjuster implements InviteLedgerStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the invite ledger steps in order and keeps a trace of each. */
export class InviteLedgerEngine {
  steps: InviteLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: InviteLedger): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: InviteLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultInviteLedgerEngine(): InviteLedgerEngine {
  return new InviteLedgerEngine(
    [
      new PercentInviteLedgerAdjuster(-3.8),
      new RoundingInviteLedgerAdjuster(0.25),
      new TitleInviteLedgerAdjuster(new Map<string, number>([["retail", 0.79], ["online", 1.4]])),
      new MinimumInviteLedgerAdjuster(42),
    ],
    [],
    0.7,
    15429.2,
  );
}
