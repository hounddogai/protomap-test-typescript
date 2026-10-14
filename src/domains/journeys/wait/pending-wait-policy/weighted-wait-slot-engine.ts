import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedWaitSlot } from "./weighted-wait-slot.js";

/** One step of the weighted wait slot calculation. */
export interface WeightedWaitSlotStep {
  describe(): string;
  adjust(item: WeightedWaitSlot, value: number): number;
}

export class FlaggedWeightedWaitSlotAdjuster implements WeightedWaitSlotStep {
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

  adjust(item: WeightedWaitSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentWeightedWaitSlotAdjuster implements WeightedWaitSlotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedWaitSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class WeightedWaitSlotMarginOffsetAdjuster implements WeightedWaitSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: WeightedWaitSlot, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class LocaleWeightedWaitSlotAdjuster implements WeightedWaitSlotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WeightedWaitSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedWaitSlotAdjuster implements WeightedWaitSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedWaitSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted wait slot steps in order and keeps a trace of each. */
export class WeightedWaitSlotEngine {
  steps: WeightedWaitSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedWaitSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedWaitSlot): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: WeightedWaitSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedWaitSlotEngine(flagsValue: flags.Registry): WeightedWaitSlotEngine {
  return new WeightedWaitSlotEngine(
    [
      new FlaggedWeightedWaitSlotAdjuster(flagsValue, "weighted-wait-slot-weighted", 4.3),
      new PercentWeightedWaitSlotAdjuster(-18.3),
      new WeightedWaitSlotMarginOffsetAdjuster(0.44),
      new LocaleWeightedWaitSlotAdjuster(new Map<string, number>([["south", 0.81], ["west", 1.14]])),
      new MinimumWeightedWaitSlotAdjuster(5.2),
    ],
    [],
    4.4,
    71999.3,
  );
}
