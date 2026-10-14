import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedWindowOverride } from "./weighted-window-override.js";

/** One step of the weighted window override calculation. */
export interface WeightedWindowOverrideModifier {
  describe(): string;
  adjust(item: WeightedWindowOverride, value: number): number;
}

export class TieredWeightedWindowOverrideAdjuster implements WeightedWindowOverrideModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedWindowOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWeightedWindowOverrideAdjuster implements WeightedWindowOverrideModifier {
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

  adjust(item: WeightedWindowOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedWindowOverrideAdjuster implements WeightedWindowOverrideModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedWindowOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWeightedWindowOverrideAdjuster implements WeightedWindowOverrideModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedWindowOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WeightedWindowOverrideClicksOffsetAdjuster implements WeightedWindowOverrideModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: WeightedWindowOverride, value: number): number {
    return value + item.clicks * this.weight;
  }
}

/** Runs the weighted window override steps in order and keeps a trace of each. */
export class WeightedWindowOverrideEngine {
  steps: WeightedWindowOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedWindowOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedWindowOverride): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: WeightedWindowOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedWindowOverrideEngine(flagsValue: flags.Registry): WeightedWindowOverrideEngine {
  return new WeightedWindowOverrideEngine(
    [
      new TieredWeightedWindowOverrideAdjuster([3106, 4965], [0.94, 1.17]),
      new FlaggedWeightedWindowOverrideAdjuster(flagsValue, "weighted-window-override-seasonal", -0.9),
      new CapWeightedWindowOverrideAdjuster(11729),
      new RoundingWeightedWindowOverrideAdjuster(0.5),
      new WeightedWindowOverrideClicksOffsetAdjuster(0.71),
    ],
    [],
    2.8,
    91116.7,
  );
}
