import * as numbers from "../../../../kit/numbers.js";
import { RegionalTicketViewLedger } from "./regional-ticket-view-ledger.js";

/** One step of the regional ticket view ledger calculation. */
export interface RegionalTicketViewLedgerAdjuster {
  describe(): string;
  adjust(item: RegionalTicketViewLedger, value: number): number;
}

export class RoundingRegionalTicketViewLedgerAdjuster implements RegionalTicketViewLedgerAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalTicketViewLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UnitRegionalTicketViewLedgerAdjuster implements RegionalTicketViewLedgerAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: RegionalTicketViewLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRegionalTicketViewLedgerAdjuster implements RegionalTicketViewLedgerAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalTicketViewLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRegionalTicketViewLedgerAdjuster implements RegionalTicketViewLedgerAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalTicketViewLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionalTicketViewLedgerWeightOffsetAdjuster implements RegionalTicketViewLedgerAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: RegionalTicketViewLedger, value: number): number {
    return value + item.weight * this.weight;
  }
}

/** Runs the regional ticket view ledger steps in order and keeps a trace of each. */
export class RegionalTicketViewLedgerEngine {
  steps: RegionalTicketViewLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalTicketViewLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalTicketViewLedger): number {
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

  evaluateAll(items: RegionalTicketViewLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalTicketViewLedgerEngine(): RegionalTicketViewLedgerEngine {
  return new RegionalTicketViewLedgerEngine(
    [
      new RoundingRegionalTicketViewLedgerAdjuster(0.1),
      new UnitRegionalTicketViewLedgerAdjuster(
        new Map<string, number>([["east", 1.08], ["north", 1.06], ["west", 0.82]]),
      ),
      new PercentRegionalTicketViewLedgerAdjuster(-5.1),
      new MinimumRegionalTicketViewLedgerAdjuster(24.7),
      new RegionalTicketViewLedgerWeightOffsetAdjuster(0.53),
    ],
    [],
    2.4,
    71045.4,
  );
}
