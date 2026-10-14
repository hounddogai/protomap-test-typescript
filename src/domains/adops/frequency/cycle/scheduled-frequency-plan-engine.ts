import * as numbers from "../../../../kit/numbers.js";
import { ScheduledFrequencyPlan } from "./scheduled-frequency-plan.js";

/** One step of the scheduled frequency plan calculation. */
export interface ScheduledFrequencyPlanModifier {
  describe(): string;
  adjust(item: ScheduledFrequencyPlan, value: number): number;
}

export class MinimumScheduledFrequencyPlanAdjuster implements ScheduledFrequencyPlanModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledFrequencyPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ScheduledFrequencyPlanRatioOffsetAdjuster implements ScheduledFrequencyPlanModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: ScheduledFrequencyPlan, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class TieredScheduledFrequencyPlanAdjuster implements ScheduledFrequencyPlanModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledFrequencyPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the scheduled frequency plan steps in order and keeps a trace of each. */
export class ScheduledFrequencyPlanEngine {
  steps: ScheduledFrequencyPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFrequencyPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledFrequencyPlan): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: ScheduledFrequencyPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledFrequencyPlanEngine(): ScheduledFrequencyPlanEngine {
  return new ScheduledFrequencyPlanEngine(
    [
      new MinimumScheduledFrequencyPlanAdjuster(38.4),
      new ScheduledFrequencyPlanRatioOffsetAdjuster(1.94),
      new TieredScheduledFrequencyPlanAdjuster([583, 1345, 2054, 3960], [0.92, 1.17, 0.9, 1.02]),
    ],
    [],
    4.4,
    29503,
  );
}
