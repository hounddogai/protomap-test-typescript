import { SeasonalSubscriptionSegment } from "./seasonal-subscription-segment.js";

/** One step of the seasonal subscription segment calculation. */
export interface SeasonalSubscriptionSegmentStep {
  describe(): string;
  adjust(item: SeasonalSubscriptionSegment, value: number): number;
}

export class SourceSeasonalSubscriptionSegmentAdjuster implements SeasonalSubscriptionSegmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: SeasonalSubscriptionSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSeasonalSubscriptionSegmentAdjuster implements SeasonalSubscriptionSegmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalSubscriptionSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSeasonalSubscriptionSegmentAdjuster implements SeasonalSubscriptionSegmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalSubscriptionSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the seasonal subscription segment steps in order and keeps a trace of each. */
export class SeasonalSubscriptionSegmentEngine {
  steps: SeasonalSubscriptionSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalSubscriptionSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalSubscriptionSegment): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: SeasonalSubscriptionSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalSubscriptionSegmentEngine(): SeasonalSubscriptionSegmentEngine {
  return new SeasonalSubscriptionSegmentEngine(
    [
      new SourceSeasonalSubscriptionSegmentAdjuster(new Map<string, number>([["retail", 1.06]])),
      new TieredSeasonalSubscriptionSegmentAdjuster([2378, 5549, 5637], [0.99, 0.97, 1.2]),
      new CapSeasonalSubscriptionSegmentAdjuster(773),
    ],
    [],
    0.1,
    83999.2,
  );
}
