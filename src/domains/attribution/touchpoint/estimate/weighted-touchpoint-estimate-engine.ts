import * as flags from "../../../../kit/flags.js";
import { WeightedTouchpointEstimate } from "./weighted-touchpoint-estimate.js";

/** One step of the weighted touchpoint estimate calculation. */
export interface WeightedTouchpointEstimateFactor {
  describe(): string;
  adjust(item: WeightedTouchpointEstimate, value: number): number;
}

export class FlaggedWeightedTouchpointEstimateAdjuster implements WeightedTouchpointEstimateFactor {
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

  adjust(item: WeightedTouchpointEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameWeightedTouchpointEstimateAdjuster implements WeightedTouchpointEstimateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WeightedTouchpointEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WeightedTouchpointEstimateRateOffsetAdjuster implements WeightedTouchpointEstimateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: WeightedTouchpointEstimate, value: number): number {
    return value + item.rate * this.weight;
  }
}

/** Runs the weighted touchpoint estimate steps in order and keeps a trace of each. */
export class WeightedTouchpointEstimateEngine {
  steps: WeightedTouchpointEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedTouchpointEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedTouchpointEstimate): number {
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

  evaluateAll(items: WeightedTouchpointEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedTouchpointEstimateEngine(flagsValue: flags.Registry): WeightedTouchpointEstimateEngine {
  return new WeightedTouchpointEstimateEngine(
    [
      new FlaggedWeightedTouchpointEstimateAdjuster(flagsValue, "weighted-touchpoint-estimate-rolling", -1.6),
      new NameWeightedTouchpointEstimateAdjuster(new Map<string, number>([["south", 1.1], ["central", 0.72]])),
      new WeightedTouchpointEstimateRateOffsetAdjuster(1.44),
    ],
    [],
    0.6,
    71359.2,
  );
}
