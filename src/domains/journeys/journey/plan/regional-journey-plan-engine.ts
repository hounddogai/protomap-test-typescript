import { RegionalJourneyPlan } from "./regional-journey-plan.js";

/** One step of the regional journey plan calculation. */
export interface RegionalJourneyPlanFactor {
  describe(): string;
  adjust(item: RegionalJourneyPlan, value: number): number;
}

export class RegionalJourneyPlanBidOffsetAdjuster implements RegionalJourneyPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: RegionalJourneyPlan, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class CapRegionalJourneyPlanAdjuster implements RegionalJourneyPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalJourneyPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRegionalJourneyPlanAdjuster implements RegionalJourneyPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalJourneyPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelRegionalJourneyPlanAdjuster implements RegionalJourneyPlanFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RegionalJourneyPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRegionalJourneyPlanAdjuster implements RegionalJourneyPlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalJourneyPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRegionalJourneyPlanAdjuster implements RegionalJourneyPlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalJourneyPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional journey plan steps in order and keeps a trace of each. */
export class RegionalJourneyPlanEngine {
  steps: RegionalJourneyPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalJourneyPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalJourneyPlan): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: RegionalJourneyPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalJourneyPlanEngine(): RegionalJourneyPlanEngine {
  return new RegionalJourneyPlanEngine(
    [
      new RegionalJourneyPlanBidOffsetAdjuster(0.48),
      new CapRegionalJourneyPlanAdjuster(26236),
      new TieredRegionalJourneyPlanAdjuster([5683, 9634], [0.87, 0.85]),
      new ChannelRegionalJourneyPlanAdjuster(new Map<string, number>([["south", 1.03], ["west", 0.7]])),
      new MinimumRegionalJourneyPlanAdjuster(23.1),
      new PercentRegionalJourneyPlanAdjuster(10.2),
    ],
    [],
    4.5,
    64492.4,
  );
}
