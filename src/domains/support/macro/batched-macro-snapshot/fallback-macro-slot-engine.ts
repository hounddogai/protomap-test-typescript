import * as flags from "../../../../kit/flags.js";
import { FallbackMacroSlot } from "./fallback-macro-slot.js";

/** One step of the fallback macro slot calculation. */
export interface FallbackMacroSlotAdjuster {
  describe(): string;
  adjust(item: FallbackMacroSlot, value: number): number;
}

export class MinimumFallbackMacroSlotAdjuster implements FallbackMacroSlotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackMacroSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FallbackMacroSlotRevisionOffsetAdjuster implements FallbackMacroSlotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: FallbackMacroSlot, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class LocaleFallbackMacroSlotAdjuster implements FallbackMacroSlotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FallbackMacroSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackMacroSlotAdjuster implements FallbackMacroSlotAdjuster {
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

  adjust(item: FallbackMacroSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFallbackMacroSlotAdjuster implements FallbackMacroSlotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackMacroSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback macro slot steps in order and keeps a trace of each. */
export class FallbackMacroSlotEngine {
  steps: FallbackMacroSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackMacroSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackMacroSlot): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: FallbackMacroSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackMacroSlotEngine(flagsValue: flags.Registry): FallbackMacroSlotEngine {
  return new FallbackMacroSlotEngine(
    [
      new MinimumFallbackMacroSlotAdjuster(33.4),
      new FallbackMacroSlotRevisionOffsetAdjuster(1.85),
      new LocaleFallbackMacroSlotAdjuster(
        new Map<string, number>([["central", 1.26], ["north", 1.03], ["west", 1.28]]),
      ),
      new FlaggedFallbackMacroSlotAdjuster(flagsValue, "fallback-macro-slot-fallback", 6.8),
      new PercentFallbackMacroSlotAdjuster(-1.4),
    ],
    [],
    3.7,
    49905.9,
  );
}
