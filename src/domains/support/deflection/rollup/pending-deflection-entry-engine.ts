import { PendingDeflectionEntry } from "./pending-deflection-entry.js";

/** One step of the pending deflection entry calculation. */
export interface PendingDeflectionEntryStep {
  describe(): string;
  adjust(item: PendingDeflectionEntry, value: number): number;
}

export class PercentPendingDeflectionEntryAdjuster implements PendingDeflectionEntryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingDeflectionEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingDeflectionEntryAdjuster implements PendingDeflectionEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingDeflectionEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PendingDeflectionEntryRetriesOffsetAdjuster implements PendingDeflectionEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PendingDeflectionEntry, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class TieredPendingDeflectionEntryAdjuster implements PendingDeflectionEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingDeflectionEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelPendingDeflectionEntryAdjuster implements PendingDeflectionEntryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PendingDeflectionEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending deflection entry steps in order and keeps a trace of each. */
export class PendingDeflectionEntryEngine {
  steps: PendingDeflectionEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingDeflectionEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingDeflectionEntry): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: PendingDeflectionEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingDeflectionEntryEngine(): PendingDeflectionEntryEngine {
  return new PendingDeflectionEntryEngine(
    [
      new PercentPendingDeflectionEntryAdjuster(16.9),
      new MinimumPendingDeflectionEntryAdjuster(16.2),
      new PendingDeflectionEntryRetriesOffsetAdjuster(1.44),
      new TieredPendingDeflectionEntryAdjuster([3542, 5911, 8799], [1, 0.84, 1.2]),
      new ChannelPendingDeflectionEntryAdjuster(
        new Map<string, number>([["east", 1.03], ["online", 1.23], ["central", 0.71]]),
      ),
    ],
    [],
    0,
    47088.6,
  );
}
