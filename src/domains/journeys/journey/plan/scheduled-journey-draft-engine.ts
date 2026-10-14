import { ScheduledJourneyDraft } from "./scheduled-journey-draft.js";

/** One step of the scheduled journey draft calculation. */
export interface ScheduledJourneyDraftStep {
  describe(): string;
  adjust(item: ScheduledJourneyDraft, value: number): number;
}

export class RegionScheduledJourneyDraftAdjuster implements ScheduledJourneyDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ScheduledJourneyDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ScheduledJourneyDraftConversionRateOffsetAdjuster implements ScheduledJourneyDraftStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: ScheduledJourneyDraft, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class CapScheduledJourneyDraftAdjuster implements ScheduledJourneyDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledJourneyDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumScheduledJourneyDraftAdjuster implements ScheduledJourneyDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledJourneyDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredScheduledJourneyDraftAdjuster implements ScheduledJourneyDraftStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledJourneyDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled journey draft steps in order and keeps a trace of each. */
export class ScheduledJourneyDraftEngine {
  steps: ScheduledJourneyDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledJourneyDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ScheduledJourneyDraft): number {
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

  evaluateAll(items: ScheduledJourneyDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultScheduledJourneyDraftEngine(): ScheduledJourneyDraftEngine {
  return new ScheduledJourneyDraftEngine(
    [
      new RegionScheduledJourneyDraftAdjuster(new Map<string, number>([["south", 1.26]])),
      new ScheduledJourneyDraftConversionRateOffsetAdjuster(1.37),
      new CapScheduledJourneyDraftAdjuster(25449),
      new MinimumScheduledJourneyDraftAdjuster(29.7),
      new TieredScheduledJourneyDraftAdjuster([169, 4258, 5992], [1.03, 0.8, 1.07]),
    ],
    [],
    4.9,
    52228.8,
  );
}
