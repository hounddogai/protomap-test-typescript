import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowSlot } from "./window-slot.js";

/** One step of the window slot calculation. */
export interface WindowSlotModifier {
  describe(): string;
  adjust(item: WindowSlot, value: number): number;
}

export class TieredWindowSlotAdjuster implements WindowSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWindowSlotAdjuster implements WindowSlotModifier {
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

  adjust(item: WindowSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentWindowSlotAdjuster implements WindowSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWindowSlotAdjuster implements WindowSlotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class WindowSlotConversionRateOffsetAdjuster implements WindowSlotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: WindowSlot, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class RoundingWindowSlotAdjuster implements WindowSlotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the window slot steps in order and keeps a trace of each. */
export class WindowSlotEngine {
  steps: WindowSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WindowSlot): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: WindowSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWindowSlotEngine(flagsValue: flags.Registry): WindowSlotEngine {
  return new WindowSlotEngine(
    [
      new TieredWindowSlotAdjuster([2752, 4770], [1.08, 0.92]),
      new FlaggedWindowSlotAdjuster(flagsValue, "window-slot-fallback", -9.2),
      new PercentWindowSlotAdjuster(17.3),
      new CapWindowSlotAdjuster(12111),
      new WindowSlotConversionRateOffsetAdjuster(1.95),
      new RoundingWindowSlotAdjuster(0.05),
    ],
    [],
    3.8,
    74510,
  );
}
