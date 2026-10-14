import * as numbers from "../../../../kit/numbers.js";
import { CreativeLedger } from "./creative-ledger.js";

/** One step of the creative ledger calculation. */
export interface CreativeLedgerFactor {
  describe(): string;
  adjust(item: CreativeLedger, value: number): number;
}

export class TieredCreativeLedgerAdjuster implements CreativeLedgerFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCreativeLedgerAdjuster implements CreativeLedgerFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreativeLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCreativeLedgerAdjuster implements CreativeLedgerFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleCreativeLedgerAdjuster implements CreativeLedgerFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CreativeLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCreativeLedgerAdjuster implements CreativeLedgerFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the creative ledger steps in order and keeps a trace of each. */
export class CreativeLedgerEngine {
  steps: CreativeLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreativeLedger): number {
    let current = item.netTotal();
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

  evaluateAll(items: CreativeLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreativeLedgerEngine(): CreativeLedgerEngine {
  return new CreativeLedgerEngine(
    [
      new TieredCreativeLedgerAdjuster([2159, 5475], [0.85, 1.05]),
      new MinimumCreativeLedgerAdjuster(7.9),
      new RoundingCreativeLedgerAdjuster(0.25),
      new TitleCreativeLedgerAdjuster(new Map<string, number>([["north", 1.13], ["east", 1.17], ["west", 0.9]])),
      new PercentCreativeLedgerAdjuster(-12.5),
    ],
    [],
    0.8,
    28041.3,
  );
}
