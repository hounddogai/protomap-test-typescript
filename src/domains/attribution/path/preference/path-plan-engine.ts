import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathPlan } from "./path-plan.js";

/** One step of the path plan calculation. */
export interface PathPlanModifier {
  describe(): string;
  adjust(item: PathPlan, value: number): number;
}

export class FlaggedPathPlanAdjuster implements PathPlanModifier {
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

  adjust(item: PathPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPathPlanAdjuster implements PathPlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPathPlanAdjuster implements PathPlanModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPathPlanAdjuster implements PathPlanModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the path plan steps in order and keeps a trace of each. */
export class PathPlanEngine {
  steps: PathPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PathPlan): number {
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

  evaluateAll(items: PathPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPathPlanEngine(flagsValue: flags.Registry): PathPlanEngine {
  return new PathPlanEngine(
    [
      new FlaggedPathPlanAdjuster(flagsValue, "path-plan-adaptive", -2.3),
      new RoundingPathPlanAdjuster(5),
      new TieredPathPlanAdjuster([4379, 4583, 5595, 9351], [0.81, 0.88, 0.96, 0.95]),
      new PercentPathPlanAdjuster(-23.2),
    ],
    [],
    0.5,
    24483.9,
  );
}
