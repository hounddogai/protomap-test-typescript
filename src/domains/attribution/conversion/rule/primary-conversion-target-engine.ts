import * as numbers from "../../../../kit/numbers.js";
import { PrimaryConversionTarget } from "./primary-conversion-target.js";

/** One step of the primary conversion target calculation. */
export interface PrimaryConversionTargetFactor {
  describe(): string;
  adjust(item: PrimaryConversionTarget, value: number): number;
}

export class TieredPrimaryConversionTargetAdjuster implements PrimaryConversionTargetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryConversionTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PrimaryConversionTargetImpressionsOffsetAdjuster implements PrimaryConversionTargetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: PrimaryConversionTarget, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class MinimumPrimaryConversionTargetAdjuster implements PrimaryConversionTargetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryConversionTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPrimaryConversionTargetAdjuster implements PrimaryConversionTargetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryConversionTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitlePrimaryConversionTargetAdjuster implements PrimaryConversionTargetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PrimaryConversionTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary conversion target steps in order and keeps a trace of each. */
export class PrimaryConversionTargetEngine {
  steps: PrimaryConversionTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryConversionTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryConversionTarget): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PrimaryConversionTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryConversionTargetEngine(): PrimaryConversionTargetEngine {
  return new PrimaryConversionTargetEngine(
    [
      new TieredPrimaryConversionTargetAdjuster([537, 937, 4119], [1.03, 0.99, 1]),
      new PrimaryConversionTargetImpressionsOffsetAdjuster(1.93),
      new MinimumPrimaryConversionTargetAdjuster(41.5),
      new PercentPrimaryConversionTargetAdjuster(8.6),
      new TitlePrimaryConversionTargetAdjuster(new Map<string, number>([["east", 1.39], ["online", 0.79]])),
    ],
    [],
    1.3,
    53108.6,
  );
}
