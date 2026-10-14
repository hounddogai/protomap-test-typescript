import * as numbers from "../../../../kit/numbers.js";
import { LegacySenderEntry } from "./legacy-sender-entry.js";

/** One step of the legacy sender entry calculation. */
export interface LegacySenderEntryFactor {
  describe(): string;
  adjust(item: LegacySenderEntry, value: number): number;
}

export class MinimumLegacySenderEntryAdjuster implements LegacySenderEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacySenderEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLegacySenderEntryAdjuster implements LegacySenderEntryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacySenderEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LegacySenderEntryScoreOffsetAdjuster implements LegacySenderEntryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: LegacySenderEntry, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the legacy sender entry steps in order and keeps a trace of each. */
export class LegacySenderEntryEngine {
  steps: LegacySenderEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacySenderEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacySenderEntry): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LegacySenderEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacySenderEntryEngine(): LegacySenderEntryEngine {
  return new LegacySenderEntryEngine(
    [
      new MinimumLegacySenderEntryAdjuster(2.2),
      new TieredLegacySenderEntryAdjuster([6224, 7311], [1.08, 1]),
      new LegacySenderEntryScoreOffsetAdjuster(1.05),
    ],
    [],
    3.8,
    6546.6,
  );
}
