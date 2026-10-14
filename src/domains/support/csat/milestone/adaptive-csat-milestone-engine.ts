import { AdaptiveCsatMilestone } from "./adaptive-csat-milestone.js";

/** One step of the adaptive csat milestone calculation. */
export interface AdaptiveCsatMilestoneStep {
  describe(): string;
  adjust(item: AdaptiveCsatMilestone, value: number): number;
}

export class SourceAdaptiveCsatMilestoneAdjuster implements AdaptiveCsatMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: AdaptiveCsatMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumAdaptiveCsatMilestoneAdjuster implements AdaptiveCsatMilestoneStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveCsatMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class AdaptiveCsatMilestoneImpressionsOffsetAdjuster implements AdaptiveCsatMilestoneStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: AdaptiveCsatMilestone, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the adaptive csat milestone steps in order and keeps a trace of each. */
export class AdaptiveCsatMilestoneEngine {
  steps: AdaptiveCsatMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveCsatMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveCsatMilestone): number {
    let current = item.weightedValue();
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

  evaluateAll(items: AdaptiveCsatMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveCsatMilestoneEngine(): AdaptiveCsatMilestoneEngine {
  return new AdaptiveCsatMilestoneEngine(
    [
      new SourceAdaptiveCsatMilestoneAdjuster(new Map<string, number>([["north", 0.97], ["east", 0.94]])),
      new MinimumAdaptiveCsatMilestoneAdjuster(12.6),
      new AdaptiveCsatMilestoneImpressionsOffsetAdjuster(1.79),
    ],
    [],
    1.1,
    70524.5,
  );
}
