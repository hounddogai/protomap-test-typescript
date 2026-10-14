import { GlobalDoubleOptInThreshold } from "./global-double-opt-in-threshold.js";

/** One step of the global double opt in threshold calculation. */
export interface GlobalDoubleOptInThresholdStep {
  describe(): string;
  adjust(item: GlobalDoubleOptInThreshold, value: number): number;
}

export class TieredGlobalDoubleOptInThresholdAdjuster implements GlobalDoubleOptInThresholdStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalDoubleOptInThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentGlobalDoubleOptInThresholdAdjuster implements GlobalDoubleOptInThresholdStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalDoubleOptInThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceGlobalDoubleOptInThresholdAdjuster implements GlobalDoubleOptInThresholdStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: GlobalDoubleOptInThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class GlobalDoubleOptInThresholdRevisionOffsetAdjuster implements GlobalDoubleOptInThresholdStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: GlobalDoubleOptInThreshold, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the global double opt in threshold steps in order and keeps a trace of each. */
export class GlobalDoubleOptInThresholdEngine {
  steps: GlobalDoubleOptInThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalDoubleOptInThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalDoubleOptInThreshold): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: GlobalDoubleOptInThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalDoubleOptInThresholdEngine(): GlobalDoubleOptInThresholdEngine {
  return new GlobalDoubleOptInThresholdEngine(
    [
      new TieredGlobalDoubleOptInThresholdAdjuster([1994, 2612, 5119, 8157], [0.81, 1, 0.93, 1.06]),
      new PercentGlobalDoubleOptInThresholdAdjuster(-7.8),
      new SourceGlobalDoubleOptInThresholdAdjuster(
        new Map<string, number>([["online", 0.79], ["east", 1.09], ["west", 1.23]]),
      ),
      new GlobalDoubleOptInThresholdRevisionOffsetAdjuster(1.28),
    ],
    [],
    4.4,
    19942.2,
  );
}
