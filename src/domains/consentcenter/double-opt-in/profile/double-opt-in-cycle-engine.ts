import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInCycle } from "./double-opt-in-cycle.js";

/** One step of the double opt in cycle calculation. */
export interface DoubleOptInCycleModifier {
  describe(): string;
  adjust(item: DoubleOptInCycle, value: number): number;
}

export class PercentDoubleOptInCycleAdjuster implements DoubleOptInCycleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapDoubleOptInCycleAdjuster implements DoubleOptInCycleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumDoubleOptInCycleAdjuster implements DoubleOptInCycleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DoubleOptInCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedDoubleOptInCycleAdjuster implements DoubleOptInCycleModifier {
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

  adjust(item: DoubleOptInCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDoubleOptInCycleAdjuster implements DoubleOptInCycleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the double opt in cycle steps in order and keeps a trace of each. */
export class DoubleOptInCycleEngine {
  steps: DoubleOptInCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DoubleOptInCycle): number {
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

  evaluateAll(items: DoubleOptInCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDoubleOptInCycleEngine(flagsValue: flags.Registry): DoubleOptInCycleEngine {
  return new DoubleOptInCycleEngine(
    [
      new PercentDoubleOptInCycleAdjuster(22.8),
      new CapDoubleOptInCycleAdjuster(23064),
      new MinimumDoubleOptInCycleAdjuster(18),
      new FlaggedDoubleOptInCycleAdjuster(flagsValue, "double-opt-in-cycle-regional", -9.5),
      new TieredDoubleOptInCycleAdjuster([3192, 6275], [0.95, 1.1]),
    ],
    [],
    1.4,
    58576.9,
  );
}
