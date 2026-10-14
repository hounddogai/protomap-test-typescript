import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ModelMilestone } from "./model-milestone.js";

/** One step of the model milestone calculation. */
export interface ModelMilestoneFactor {
  describe(): string;
  adjust(item: ModelMilestone, value: number): number;
}

export class FlaggedModelMilestoneAdjuster implements ModelMilestoneFactor {
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

  adjust(item: ModelMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ModelMilestoneBidOffsetAdjuster implements ModelMilestoneFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: ModelMilestone, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class MinimumModelMilestoneAdjuster implements ModelMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredModelMilestoneAdjuster implements ModelMilestoneFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingModelMilestoneAdjuster implements ModelMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ModelMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the model milestone steps in order and keeps a trace of each. */
export class ModelMilestoneEngine {
  steps: ModelMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ModelMilestone): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ModelMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultModelMilestoneEngine(flagsValue: flags.Registry): ModelMilestoneEngine {
  return new ModelMilestoneEngine(
    [
      new FlaggedModelMilestoneAdjuster(flagsValue, "model-milestone-default", 8.2),
      new ModelMilestoneBidOffsetAdjuster(0.76),
      new MinimumModelMilestoneAdjuster(30.2),
      new TieredModelMilestoneAdjuster([3875, 4981, 6026], [1.06, 0.8, 1.11]),
      new RoundingModelMilestoneAdjuster(5),
    ],
    [],
    1.8,
    64580.2,
  );
}
