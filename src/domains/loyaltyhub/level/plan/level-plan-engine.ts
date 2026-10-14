import * as numbers from "../../../../kit/numbers.js";
import { LevelPlan } from "./level-plan.js";

/** One step of the level plan calculation. */
export interface LevelPlanStep {
  describe(): string;
  adjust(item: LevelPlan, value: number): number;
}

export class RoundingLevelPlanAdjuster implements LevelPlanStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LevelPlanRevisionOffsetAdjuster implements LevelPlanStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: LevelPlan, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class TieredLevelPlanAdjuster implements LevelPlanStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelLevelPlanAdjuster implements LevelPlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LevelPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the level plan steps in order and keeps a trace of each. */
export class LevelPlanEngine {
  steps: LevelPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LevelPlan): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: LevelPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLevelPlanEngine(): LevelPlanEngine {
  return new LevelPlanEngine(
    [
      new RoundingLevelPlanAdjuster(0.05),
      new LevelPlanRevisionOffsetAdjuster(1.09),
      new TieredLevelPlanAdjuster([2359, 2865, 6033], [1.1, 1.04, 0.8]),
      new ChannelLevelPlanAdjuster(
        new Map<string, number>([["south", 0.87], ["west", 1.32], ["central", 1.14]]),
      ),
    ],
    [],
    0.1,
    80211.7,
  );
}
