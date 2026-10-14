import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalFrequencyAllocation } from "./global-frequency-allocation.js";

/** One step of the global frequency allocation calculation. */
export interface GlobalFrequencyAllocationModifier {
  describe(): string;
  adjust(item: GlobalFrequencyAllocation, value: number): number;
}

export class PercentGlobalFrequencyAllocationAdjuster implements GlobalFrequencyAllocationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalFrequencyAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceGlobalFrequencyAllocationAdjuster implements GlobalFrequencyAllocationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: GlobalFrequencyAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingGlobalFrequencyAllocationAdjuster implements GlobalFrequencyAllocationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalFrequencyAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedGlobalFrequencyAllocationAdjuster implements GlobalFrequencyAllocationModifier {
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

  adjust(item: GlobalFrequencyAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class GlobalFrequencyAllocationLimitOffsetAdjuster implements GlobalFrequencyAllocationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: GlobalFrequencyAllocation, value: number): number {
    return value + item.limit * this.weight;
  }
}

/** Runs the global frequency allocation steps in order and keeps a trace of each. */
export class GlobalFrequencyAllocationEngine {
  steps: GlobalFrequencyAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalFrequencyAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalFrequencyAllocation): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: GlobalFrequencyAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalFrequencyAllocationEngine(flagsValue: flags.Registry): GlobalFrequencyAllocationEngine {
  return new GlobalFrequencyAllocationEngine(
    [
      new PercentGlobalFrequencyAllocationAdjuster(-8.1),
      new SourceGlobalFrequencyAllocationAdjuster(new Map<string, number>([["east", 0.87]])),
      new RoundingGlobalFrequencyAllocationAdjuster(5),
      new FlaggedGlobalFrequencyAllocationAdjuster(flagsValue, "global-frequency-allocation-tiered", 6),
      new GlobalFrequencyAllocationLimitOffsetAdjuster(1.21),
    ],
    [],
    3.7,
    14316.6,
  );
}
