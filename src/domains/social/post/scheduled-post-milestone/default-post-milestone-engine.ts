import * as numbers from "../../../../kit/numbers.js";
import { DefaultPostMilestone } from "./default-post-milestone.js";

/** One step of the default post milestone calculation. */
export interface DefaultPostMilestoneStep {
  describe(): string;
  adjust(item: DefaultPostMilestone, value: number): number;
}

export class PercentDefaultPostMilestoneAdjuster implements DefaultPostMilestoneStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultPostMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultPostMilestoneAdjuster implements DefaultPostMilestoneStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultPostMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameDefaultPostMilestoneAdjuster implements DefaultPostMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DefaultPostMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDefaultPostMilestoneAdjuster implements DefaultPostMilestoneStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultPostMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default post milestone steps in order and keeps a trace of each. */
export class DefaultPostMilestoneEngine {
  steps: DefaultPostMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPostMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultPostMilestone): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: DefaultPostMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultPostMilestoneEngine(): DefaultPostMilestoneEngine {
  return new DefaultPostMilestoneEngine(
    [
      new PercentDefaultPostMilestoneAdjuster(-10.4),
      new CapDefaultPostMilestoneAdjuster(22901),
      new NameDefaultPostMilestoneAdjuster(new Map<string, number>([["west", 1.28], ["east", 0.77]])),
      new TieredDefaultPostMilestoneAdjuster([5784, 7580], [1.2, 1.15]),
    ],
    [],
    3.5,
    83640.3,
  );
}
