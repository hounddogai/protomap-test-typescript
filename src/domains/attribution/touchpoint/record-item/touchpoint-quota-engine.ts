import { TouchpointQuota } from "./touchpoint-quota.js";

/** One step of the touchpoint quota calculation. */
export interface TouchpointQuotaModifier {
  describe(): string;
  adjust(item: TouchpointQuota, value: number): number;
}

export class TouchpointQuotaRatioOffsetAdjuster implements TouchpointQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: TouchpointQuota, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class MinimumTouchpointQuotaAdjuster implements TouchpointQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TouchpointQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapTouchpointQuotaAdjuster implements TouchpointQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTouchpointQuotaAdjuster implements TouchpointQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TouchpointQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the touchpoint quota steps in order and keeps a trace of each. */
export class TouchpointQuotaEngine {
  steps: TouchpointQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TouchpointQuota): number {
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

  evaluateAll(items: TouchpointQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTouchpointQuotaEngine(): TouchpointQuotaEngine {
  return new TouchpointQuotaEngine(
    [
      new TouchpointQuotaRatioOffsetAdjuster(1.99),
      new MinimumTouchpointQuotaAdjuster(48.1),
      new CapTouchpointQuotaAdjuster(5921),
      new TieredTouchpointQuotaAdjuster([60, 8729, 9643], [1.16, 1.01, 1.14]),
    ],
    [],
    2.2,
    39507.2,
  );
}
