import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedStreakCycle } from "./weighted-streak-cycle.js";

/** One step of the weighted streak cycle calculation. */
export interface WeightedStreakCycleFactor {
  describe(): string;
  adjust(item: WeightedStreakCycle, value: number): number;
}

export class LabelWeightedStreakCycleAdjuster implements WeightedStreakCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedStreakCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WeightedStreakCycleCreatedAtOffsetAdjuster implements WeightedStreakCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: WeightedStreakCycle, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class RoundingWeightedStreakCycleAdjuster implements WeightedStreakCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedStreakCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWeightedStreakCycleAdjuster implements WeightedStreakCycleFactor {
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

  adjust(item: WeightedStreakCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted streak cycle steps in order and keeps a trace of each. */
export class WeightedStreakCycleEngine {
  steps: WeightedStreakCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedStreakCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedStreakCycle): number {
    let current = item.netVolume();
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

  evaluateAll(items: WeightedStreakCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedStreakCycleEngine(flagsValue: flags.Registry): WeightedStreakCycleEngine {
  return new WeightedStreakCycleEngine(
    [
      new LabelWeightedStreakCycleAdjuster(new Map<string, number>([["north", 1.32], ["south", 0.91]])),
      new WeightedStreakCycleCreatedAtOffsetAdjuster(1.72),
      new RoundingWeightedStreakCycleAdjuster(0.5),
      new FlaggedWeightedStreakCycleAdjuster(flagsValue, "weighted-streak-cycle-tiered", 6.3),
    ],
    [],
    4.3,
    52839.1,
  );
}
