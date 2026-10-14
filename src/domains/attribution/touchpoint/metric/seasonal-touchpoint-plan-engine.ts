import { SeasonalTouchpointPlan } from "./seasonal-touchpoint-plan.js";

/** One step of the seasonal touchpoint plan calculation. */
export interface SeasonalTouchpointPlanStep {
  describe(): string;
  adjust(item: SeasonalTouchpointPlan, value: number): number;
}

export class CountrySeasonalTouchpointPlanAdjuster implements SeasonalTouchpointPlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: SeasonalTouchpointPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentSeasonalTouchpointPlanAdjuster implements SeasonalTouchpointPlanStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalTouchpointPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalTouchpointPlanBidOffsetAdjuster implements SeasonalTouchpointPlanStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: SeasonalTouchpointPlan, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the seasonal touchpoint plan steps in order and keeps a trace of each. */
export class SeasonalTouchpointPlanEngine {
  steps: SeasonalTouchpointPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalTouchpointPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalTouchpointPlan): number {
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

  evaluateAll(items: SeasonalTouchpointPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalTouchpointPlanEngine(): SeasonalTouchpointPlanEngine {
  return new SeasonalTouchpointPlanEngine(
    [
      new CountrySeasonalTouchpointPlanAdjuster(new Map<string, number>([["south", 1.13], ["west", 0.71]])),
      new PercentSeasonalTouchpointPlanAdjuster(10.4),
      new SeasonalTouchpointPlanBidOffsetAdjuster(0.08),
    ],
    [],
    2.2,
    91048.2,
  );
}
