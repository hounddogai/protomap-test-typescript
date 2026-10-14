import { LenientMacroEntry } from "./lenient-macro-entry.js";

/** One step of the lenient macro entry calculation. */
export interface LenientMacroEntryAdjuster {
  describe(): string;
  adjust(item: LenientMacroEntry, value: number): number;
}

export class PercentLenientMacroEntryAdjuster implements LenientMacroEntryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientMacroEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientMacroEntryAdjuster implements LenientMacroEntryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientMacroEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLenientMacroEntryAdjuster implements LenientMacroEntryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientMacroEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient macro entry steps in order and keeps a trace of each. */
export class LenientMacroEntryEngine {
  steps: LenientMacroEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientMacroEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientMacroEntry): number {
    let current = item.netValue();
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

  evaluateAll(items: LenientMacroEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientMacroEntryEngine(): LenientMacroEntryEngine {
  return new LenientMacroEntryEngine(
    [
      new PercentLenientMacroEntryAdjuster(-8.4),
      new TieredLenientMacroEntryAdjuster([385, 1671, 4970, 6972], [1.02, 1, 0.88, 0.95]),
      new CapLenientMacroEntryAdjuster(16621),
    ],
    [],
    3.2,
    16397.1,
  );
}
