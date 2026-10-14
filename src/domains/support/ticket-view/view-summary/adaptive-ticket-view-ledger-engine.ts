import * as flags from "../../../../kit/flags.js";
import { AdaptiveTicketViewLedger } from "./adaptive-ticket-view-ledger.js";

/** One step of the adaptive ticket view ledger calculation. */
export interface AdaptiveTicketViewLedgerAdjuster {
  describe(): string;
  adjust(item: AdaptiveTicketViewLedger, value: number): number;
}

export class UnitAdaptiveTicketViewLedgerAdjuster implements AdaptiveTicketViewLedgerAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: AdaptiveTicketViewLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredAdaptiveTicketViewLedgerAdjuster implements AdaptiveTicketViewLedgerAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveTicketViewLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptiveTicketViewLedgerAdjuster implements AdaptiveTicketViewLedgerAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveTicketViewLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveTicketViewLedgerAdjuster implements AdaptiveTicketViewLedgerAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveTicketViewLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedAdaptiveTicketViewLedgerAdjuster implements AdaptiveTicketViewLedgerAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: AdaptiveTicketViewLedger, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive ticket view ledger steps in order and keeps a trace of each. */
export class AdaptiveTicketViewLedgerEngine {
  steps: AdaptiveTicketViewLedgerAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveTicketViewLedgerAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveTicketViewLedger): number {
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

  evaluateAll(items: AdaptiveTicketViewLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveTicketViewLedgerEngine(flagsValue: flags.Registry): AdaptiveTicketViewLedgerEngine {
  return new AdaptiveTicketViewLedgerEngine(
    [
      new UnitAdaptiveTicketViewLedgerAdjuster(
        new Map<string, number>([["online", 0.87], ["south", 1.25], ["west", 0.78]]),
      ),
      new TieredAdaptiveTicketViewLedgerAdjuster([2399, 4177, 8983, 9039], [0.9, 0.9, 1.16, 0.91]),
      new CapAdaptiveTicketViewLedgerAdjuster(30510),
      new MinimumAdaptiveTicketViewLedgerAdjuster(21.5),
      new FlaggedAdaptiveTicketViewLedgerAdjuster(flagsValue, "adaptive-ticket-view-ledger-seasonal", -3.2),
    ],
    [],
    0.6,
    97631.7,
  );
}
