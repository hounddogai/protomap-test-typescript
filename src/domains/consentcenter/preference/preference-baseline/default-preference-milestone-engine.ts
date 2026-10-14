import { DefaultPreferenceMilestone } from "./default-preference-milestone.js";

/** One step of the default preference milestone calculation. */
export interface DefaultPreferenceMilestoneModifier {
  describe(): string;
  adjust(item: DefaultPreferenceMilestone, value: number): number;
}

export class TieredDefaultPreferenceMilestoneAdjuster implements DefaultPreferenceMilestoneModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultPreferenceMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultPreferenceMilestoneAdjuster implements DefaultPreferenceMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultPreferenceMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentDefaultPreferenceMilestoneAdjuster implements DefaultPreferenceMilestoneModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultPreferenceMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UnitDefaultPreferenceMilestoneAdjuster implements DefaultPreferenceMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: DefaultPreferenceMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default preference milestone steps in order and keeps a trace of each. */
export class DefaultPreferenceMilestoneEngine {
  steps: DefaultPreferenceMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPreferenceMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultPreferenceMilestone): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: DefaultPreferenceMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultPreferenceMilestoneEngine(): DefaultPreferenceMilestoneEngine {
  return new DefaultPreferenceMilestoneEngine(
    [
      new TieredDefaultPreferenceMilestoneAdjuster([2950, 6002, 6169, 9257], [0.82, 1.03, 1.05, 0.82]),
      new MinimumDefaultPreferenceMilestoneAdjuster(29.1),
      new PercentDefaultPreferenceMilestoneAdjuster(5.7),
      new UnitDefaultPreferenceMilestoneAdjuster(new Map<string, number>([["north", 1.36]])),
    ],
    [],
    4.8,
    23156.2,
  );
}
