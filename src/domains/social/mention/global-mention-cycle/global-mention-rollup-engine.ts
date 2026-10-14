import * as numbers from "../../../../kit/numbers.js";
import { GlobalMentionRollup } from "./global-mention-rollup.js";

/** One step of the global mention rollup calculation. */
export interface GlobalMentionRollupModifier {
  describe(): string;
  adjust(item: GlobalMentionRollup, value: number): number;
}

export class TieredGlobalMentionRollupAdjuster implements GlobalMentionRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalMentionRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumGlobalMentionRollupAdjuster implements GlobalMentionRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalMentionRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleGlobalMentionRollupAdjuster implements GlobalMentionRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: GlobalMentionRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapGlobalMentionRollupAdjuster implements GlobalMentionRollupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalMentionRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class GlobalMentionRollupLimitOffsetAdjuster implements GlobalMentionRollupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: GlobalMentionRollup, value: number): number {
    return value + item.limit * this.weight;
  }
}

/** Runs the global mention rollup steps in order and keeps a trace of each. */
export class GlobalMentionRollupEngine {
  steps: GlobalMentionRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalMentionRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalMentionRollup): number {
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

  evaluateAll(items: GlobalMentionRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalMentionRollupEngine(): GlobalMentionRollupEngine {
  return new GlobalMentionRollupEngine(
    [
      new TieredGlobalMentionRollupAdjuster([364, 3203, 5775], [0.91, 1.11, 1.14]),
      new MinimumGlobalMentionRollupAdjuster(21),
      new TitleGlobalMentionRollupAdjuster(new Map<string, number>([["north", 0.9], ["east", 1.16]])),
      new CapGlobalMentionRollupAdjuster(32169),
      new GlobalMentionRollupLimitOffsetAdjuster(0.59),
    ],
    [],
    0.3,
    31142.9,
  );
}
