import { PrimaryQueueRollup } from "./primary-queue-rollup.js";

/** One step of the primary queue rollup calculation. */
export interface PrimaryQueueRollupModifier {
  describe(): string;
  adjust(item: PrimaryQueueRollup, value: number): number;
}

export class MinimumPrimaryQueueRollupAdjuster implements PrimaryQueueRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryQueueRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PrimaryQueueRollupRetriesOffsetAdjuster implements PrimaryQueueRollupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: PrimaryQueueRollup, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class TitlePrimaryQueueRollupAdjuster implements PrimaryQueueRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PrimaryQueueRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPrimaryQueueRollupAdjuster implements PrimaryQueueRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryQueueRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPrimaryQueueRollupAdjuster implements PrimaryQueueRollupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryQueueRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary queue rollup steps in order and keeps a trace of each. */
export class PrimaryQueueRollupEngine {
  steps: PrimaryQueueRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryQueueRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryQueueRollup): number {
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

  evaluateAll(items: PrimaryQueueRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryQueueRollupEngine(): PrimaryQueueRollupEngine {
  return new PrimaryQueueRollupEngine(
    [
      new MinimumPrimaryQueueRollupAdjuster(7.3),
      new PrimaryQueueRollupRetriesOffsetAdjuster(1.07),
      new TitlePrimaryQueueRollupAdjuster(
        new Map<string, number>([["east", 1.29], ["north", 0.78], ["online", 1.27]]),
      ),
      new TieredPrimaryQueueRollupAdjuster([457, 3505, 6296], [1.17, 0.88, 1.06]),
      new PercentPrimaryQueueRollupAdjuster(8.2),
    ],
    [],
    0.8,
    70151.6,
  );
}
