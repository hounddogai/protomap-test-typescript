import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedFlightPlan } from "./weighted-flight-plan.js";

/** One step of the weighted flight plan calculation. */
export interface WeightedFlightPlanFactor {
  describe(): string;
  adjust(item: WeightedFlightPlan, value: number): number;
}

export class FlaggedWeightedFlightPlanAdjuster implements WeightedFlightPlanFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: WeightedFlightPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWeightedFlightPlanAdjuster implements WeightedFlightPlanFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedFlightPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapWeightedFlightPlanAdjuster implements WeightedFlightPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedFlightPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the weighted flight plan steps in order and keeps a trace of each. */
export class WeightedFlightPlanEngine {
  steps: WeightedFlightPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedFlightPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedFlightPlan): number {
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

  evaluateAll(items: WeightedFlightPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedFlightPlanEngine(flagsValue: flags.Registry): WeightedFlightPlanEngine {
  return new WeightedFlightPlanEngine(
    [
      new FlaggedWeightedFlightPlanAdjuster(flagsValue, "weighted-flight-plan-primary", -7.5),
      new RoundingWeightedFlightPlanAdjuster(0.5),
      new CapWeightedFlightPlanAdjuster(19386),
    ],
    [],
    3.1,
    50357.3,
  );
}
