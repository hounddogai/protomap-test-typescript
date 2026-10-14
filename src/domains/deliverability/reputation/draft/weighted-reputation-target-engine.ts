import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedReputationTarget } from "./weighted-reputation-target.js";

/** One step of the weighted reputation target calculation. */
export interface WeightedReputationTargetFactor {
  describe(): string;
  adjust(item: WeightedReputationTarget, value: number): number;
}

export class WeightedReputationTargetUpdatedAtOffsetAdjuster implements WeightedReputationTargetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: WeightedReputationTarget, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class CapWeightedReputationTargetAdjuster implements WeightedReputationTargetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedReputationTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWeightedReputationTargetAdjuster implements WeightedReputationTargetFactor {
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

  adjust(item: WeightedReputationTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWeightedReputationTargetAdjuster implements WeightedReputationTargetFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedReputationTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleWeightedReputationTargetAdjuster implements WeightedReputationTargetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WeightedReputationTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted reputation target steps in order and keeps a trace of each. */
export class WeightedReputationTargetEngine {
  steps: WeightedReputationTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedReputationTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedReputationTarget): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: WeightedReputationTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedReputationTargetEngine(flagsValue: flags.Registry): WeightedReputationTargetEngine {
  return new WeightedReputationTargetEngine(
    [
      new WeightedReputationTargetUpdatedAtOffsetAdjuster(0.64),
      new CapWeightedReputationTargetAdjuster(42093),
      new FlaggedWeightedReputationTargetAdjuster(flagsValue, "weighted-reputation-target-strict", -4.5),
      new RoundingWeightedReputationTargetAdjuster(0.5),
      new LocaleWeightedReputationTargetAdjuster(new Map<string, number>([["south", 1.02], ["east", 0.87]])),
    ],
    [],
    4.8,
    80107.7,
  );
}
