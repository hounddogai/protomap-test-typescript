import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { OptOutPlan } from "./opt-out-plan.js";

/** One step of the opt out plan calculation. */
export interface OptOutPlanAdjuster {
  describe(): string;
  adjust(item: OptOutPlan, value: number): number;
}

export class FlaggedOptOutPlanAdjuster implements OptOutPlanAdjuster {
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

  adjust(item: OptOutPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class OptOutPlanBatchSizeOffsetAdjuster implements OptOutPlanAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: OptOutPlan, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class TieredOptOutPlanAdjuster implements OptOutPlanAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingOptOutPlanAdjuster implements OptOutPlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentOptOutPlanAdjuster implements OptOutPlanAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: OptOutPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the opt out plan steps in order and keeps a trace of each. */
export class OptOutPlanEngine {
  steps: OptOutPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: OptOutPlan): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: OptOutPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultOptOutPlanEngine(flagsValue: flags.Registry): OptOutPlanEngine {
  return new OptOutPlanEngine(
    [
      new FlaggedOptOutPlanAdjuster(flagsValue, "opt-out-plan-rolling", -3.3),
      new OptOutPlanBatchSizeOffsetAdjuster(0.21),
      new TieredOptOutPlanAdjuster([257, 1580, 7301, 7874], [0.98, 0.91, 1.14, 1.09]),
      new RoundingOptOutPlanAdjuster(0.25),
      new PercentOptOutPlanAdjuster(6.1),
    ],
    [],
    2.4,
    32928.6,
  );
}
