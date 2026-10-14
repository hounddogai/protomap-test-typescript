import * as numbers from "../../../../kit/numbers.js";
import { GlobalPlacementLedger } from "./global-placement-ledger.js";

/** One step of the global placement ledger calculation. */
export interface GlobalPlacementLedgerModifier {
  describe(): string;
  adjust(item: GlobalPlacementLedger, value: number): number;
}

export class MinimumGlobalPlacementLedgerAdjuster implements GlobalPlacementLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalPlacementLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingGlobalPlacementLedgerAdjuster implements GlobalPlacementLedgerModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalPlacementLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentGlobalPlacementLedgerAdjuster implements GlobalPlacementLedgerModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalPlacementLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalPlacementLedgerAdjuster implements GlobalPlacementLedgerModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalPlacementLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global placement ledger steps in order and keeps a trace of each. */
export class GlobalPlacementLedgerEngine {
  steps: GlobalPlacementLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalPlacementLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalPlacementLedger): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: GlobalPlacementLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalPlacementLedgerEngine(): GlobalPlacementLedgerEngine {
  return new GlobalPlacementLedgerEngine(
    [
      new MinimumGlobalPlacementLedgerAdjuster(20.3),
      new RoundingGlobalPlacementLedgerAdjuster(5),
      new PercentGlobalPlacementLedgerAdjuster(-5.2),
      new TieredGlobalPlacementLedgerAdjuster([1638, 2215, 9562], [1.19, 1.02, 1.02]),
    ],
    [],
    1.8,
    8983.8,
  );
}
