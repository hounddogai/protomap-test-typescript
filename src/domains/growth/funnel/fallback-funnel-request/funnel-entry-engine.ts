import * as numbers from "../../../../kit/numbers.js";
import { FunnelEntry } from "./funnel-entry.js";

/** One step of the funnel entry calculation. */
export interface FunnelEntryStep {
  describe(): string;
  adjust(item: FunnelEntry, value: number): number;
}

export class TieredFunnelEntryAdjuster implements FunnelEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleFunnelEntryAdjuster implements FunnelEntryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FunnelEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFunnelEntryAdjuster implements FunnelEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFunnelEntryAdjuster implements FunnelEntryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the funnel entry steps in order and keeps a trace of each. */
export class FunnelEntryEngine {
  steps: FunnelEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FunnelEntry): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: FunnelEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFunnelEntryEngine(): FunnelEntryEngine {
  return new FunnelEntryEngine(
    [
      new TieredFunnelEntryAdjuster([3384, 3685], [0.88, 1.1]),
      new LocaleFunnelEntryAdjuster(new Map<string, number>([["north", 0.87], ["south", 0.9]])),
      new MinimumFunnelEntryAdjuster(37.1),
      new PercentFunnelEntryAdjuster(3.6),
    ],
    [],
    4.6,
    88233.6,
  );
}
