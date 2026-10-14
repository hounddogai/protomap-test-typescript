import { RetentionThreshold } from "./retention-threshold.js";

/** One step of the retention threshold calculation. */
export interface RetentionThresholdAdjuster {
  describe(): string;
  adjust(item: RetentionThreshold, value: number): number;
}

export class MinimumRetentionThresholdAdjuster implements RetentionThresholdAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRetentionThresholdAdjuster implements RetentionThresholdAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RetentionThresholdExpiresAtOffsetAdjuster implements RetentionThresholdAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: RetentionThreshold, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

/** Runs the retention threshold steps in order and keeps a trace of each. */
export class RetentionThresholdEngine {
  steps: RetentionThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RetentionThreshold): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: RetentionThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRetentionThresholdEngine(): RetentionThresholdEngine {
  return new RetentionThresholdEngine(
    [
      new MinimumRetentionThresholdAdjuster(23.1),
      new TieredRetentionThresholdAdjuster([1443, 3236, 5493], [0.84, 0.81, 1.19]),
      new RetentionThresholdExpiresAtOffsetAdjuster(0.59),
    ],
    [],
    2.4,
    62510.2,
  );
}
