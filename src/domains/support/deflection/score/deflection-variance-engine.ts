import { DeflectionVariance } from "./deflection-variance.js";

/** One step of the deflection variance calculation. */
export interface DeflectionVarianceFactor {
  describe(): string;
  adjust(item: DeflectionVariance, value: number): number;
}

export class DeflectionVarianceAttemptsOffsetAdjuster implements DeflectionVarianceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: DeflectionVariance, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class LocaleDeflectionVarianceAdjuster implements DeflectionVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: DeflectionVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDeflectionVarianceAdjuster implements DeflectionVarianceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDeflectionVarianceAdjuster implements DeflectionVarianceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DeflectionVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDeflectionVarianceAdjuster implements DeflectionVarianceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the deflection variance steps in order and keeps a trace of each. */
export class DeflectionVarianceEngine {
  steps: DeflectionVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionVariance): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: DeflectionVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionVarianceEngine(): DeflectionVarianceEngine {
  return new DeflectionVarianceEngine(
    [
      new DeflectionVarianceAttemptsOffsetAdjuster(1.99),
      new LocaleDeflectionVarianceAdjuster(new Map<string, number>([["east", 0.8], ["online", 0.72]])),
      new CapDeflectionVarianceAdjuster(8099),
      new PercentDeflectionVarianceAdjuster(-19.3),
      new TieredDeflectionVarianceAdjuster([4110, 4492, 7544, 9837], [0.81, 1.17, 1.09, 0.92]),
    ],
    [],
    1.5,
    26307.2,
  );
}
