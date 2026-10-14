import { FallbackFraudCheckException } from "./fallback-fraud-check-exception.js";

/** One step of the fallback fraud check exception calculation. */
export interface FallbackFraudCheckExceptionStep {
  describe(): string;
  adjust(item: FallbackFraudCheckException, value: number): number;
}

export class FallbackFraudCheckExceptionCreatedAtOffsetAdjuster implements FallbackFraudCheckExceptionStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: FallbackFraudCheckException, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class CapFallbackFraudCheckExceptionAdjuster implements FallbackFraudCheckExceptionStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackFraudCheckException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFallbackFraudCheckExceptionAdjuster implements FallbackFraudCheckExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackFraudCheckException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackFraudCheckExceptionAdjuster implements FallbackFraudCheckExceptionStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackFraudCheckException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFallbackFraudCheckExceptionAdjuster implements FallbackFraudCheckExceptionStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackFraudCheckException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback fraud check exception steps in order and keeps a trace of each. */
export class FallbackFraudCheckExceptionEngine {
  steps: FallbackFraudCheckExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFraudCheckExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackFraudCheckException): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackFraudCheckException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackFraudCheckExceptionEngine(): FallbackFraudCheckExceptionEngine {
  return new FallbackFraudCheckExceptionEngine(
    [
      new FallbackFraudCheckExceptionCreatedAtOffsetAdjuster(0.24),
      new CapFallbackFraudCheckExceptionAdjuster(35282),
      new PercentFallbackFraudCheckExceptionAdjuster(18),
      new MinimumFallbackFraudCheckExceptionAdjuster(7.2),
      new TieredFallbackFraudCheckExceptionAdjuster([1794, 2116, 3456, 5521], [1.19, 1.03, 0.89, 1.09]),
    ],
    [],
    1,
    61170.8,
  );
}
