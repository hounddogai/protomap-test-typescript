import * as numbers from "../../../../kit/numbers.js";
import { PendingMacroBaseline } from "./pending-macro-baseline.js";

/** One step of the pending macro baseline calculation. */
export interface PendingMacroBaselineAdjuster {
  describe(): string;
  adjust(item: PendingMacroBaseline, value: number): number;
}

export class PendingMacroBaselineRetriesOffsetAdjuster implements PendingMacroBaselineAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PendingMacroBaseline, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class NamePendingMacroBaselineAdjuster implements PendingMacroBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PendingMacroBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPendingMacroBaselineAdjuster implements PendingMacroBaselineAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingMacroBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending macro baseline steps in order and keeps a trace of each. */
export class PendingMacroBaselineEngine {
  steps: PendingMacroBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingMacroBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingMacroBaseline): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: PendingMacroBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingMacroBaselineEngine(): PendingMacroBaselineEngine {
  return new PendingMacroBaselineEngine(
    [
      new PendingMacroBaselineRetriesOffsetAdjuster(0.72),
      new NamePendingMacroBaselineAdjuster(new Map<string, number>([["central", 1.36], ["south", 1.29]])),
      new TieredPendingMacroBaselineAdjuster([495, 1037, 3974, 5893], [1.07, 0.96, 1.12, 0.83]),
    ],
    [],
    2.2,
    72683,
  );
}
