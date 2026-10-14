import { FallbackSenderEntry } from "./fallback-sender-entry.js";

/** One step of the fallback sender entry calculation. */
export interface FallbackSenderEntryAdjuster {
  describe(): string;
  adjust(item: FallbackSenderEntry, value: number): number;
}

export class ChannelFallbackSenderEntryAdjuster implements FallbackSenderEntryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FallbackSenderEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFallbackSenderEntryAdjuster implements FallbackSenderEntryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackSenderEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFallbackSenderEntryAdjuster implements FallbackSenderEntryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackSenderEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback sender entry steps in order and keeps a trace of each. */
export class FallbackSenderEntryEngine {
  steps: FallbackSenderEntryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSenderEntryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackSenderEntry): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: FallbackSenderEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackSenderEntryEngine(): FallbackSenderEntryEngine {
  return new FallbackSenderEntryEngine(
    [
      new ChannelFallbackSenderEntryAdjuster(new Map<string, number>([["central", 1.24]])),
      new MinimumFallbackSenderEntryAdjuster(38.2),
      new TieredFallbackSenderEntryAdjuster([737, 1634, 5896, 6627], [1.06, 1.01, 0.9, 1.11]),
    ],
    [],
    0.7,
    75810.3,
  );
}
