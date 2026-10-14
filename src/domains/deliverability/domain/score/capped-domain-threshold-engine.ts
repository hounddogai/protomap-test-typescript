import { CappedDomainThreshold } from "./capped-domain-threshold.js";

/** One step of the capped domain threshold calculation. */
export interface CappedDomainThresholdStep {
  describe(): string;
  adjust(item: CappedDomainThreshold, value: number): number;
}

export class TieredCappedDomainThresholdAdjuster implements CappedDomainThresholdStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedDomainThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CappedDomainThresholdRevisionOffsetAdjuster implements CappedDomainThresholdStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: CappedDomainThreshold, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class CategoryCappedDomainThresholdAdjuster implements CappedDomainThresholdStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: CappedDomainThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped domain threshold steps in order and keeps a trace of each. */
export class CappedDomainThresholdEngine {
  steps: CappedDomainThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedDomainThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedDomainThreshold): number {
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

  evaluateAll(items: CappedDomainThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedDomainThresholdEngine(): CappedDomainThresholdEngine {
  return new CappedDomainThresholdEngine(
    [
      new TieredCappedDomainThresholdAdjuster([3509, 4921, 7789, 8809], [1.17, 1.17, 1.16, 0.97]),
      new CappedDomainThresholdRevisionOffsetAdjuster(1.31),
      new CategoryCappedDomainThresholdAdjuster(new Map<string, number>([["south", 1.17]])),
    ],
    [],
    2.6,
    21820.2,
  );
}
