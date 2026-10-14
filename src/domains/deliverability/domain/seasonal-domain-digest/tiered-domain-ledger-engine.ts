import * as numbers from "../../../../kit/numbers.js";
import { TieredDomainLedger } from "./tiered-domain-ledger.js";

/** One step of the tiered domain ledger calculation. */
export interface TieredDomainLedgerModifier {
  describe(): string;
  adjust(item: TieredDomainLedger, value: number): number;
}

export class NameTieredDomainLedgerAdjuster implements TieredDomainLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TieredDomainLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTieredDomainLedgerAdjuster implements TieredDomainLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredDomainLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTieredDomainLedgerAdjuster implements TieredDomainLedgerModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredDomainLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered domain ledger steps in order and keeps a trace of each. */
export class TieredDomainLedgerEngine {
  steps: TieredDomainLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredDomainLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredDomainLedger): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: TieredDomainLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredDomainLedgerEngine(): TieredDomainLedgerEngine {
  return new TieredDomainLedgerEngine(
    [
      new NameTieredDomainLedgerAdjuster(new Map<string, number>([["south", 0.75]])),
      new MinimumTieredDomainLedgerAdjuster(7.7),
      new RoundingTieredDomainLedgerAdjuster(0.05),
    ],
    [],
    1.5,
    30155.9,
  );
}
