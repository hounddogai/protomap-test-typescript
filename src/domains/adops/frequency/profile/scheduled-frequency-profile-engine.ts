import * as flags from "../../../../kit/flags.js";
import { ScheduledFrequencyProfile } from "./scheduled-frequency-profile.js";

/** One step of the scheduled frequency profile calculation. */
export interface ScheduledFrequencyProfileAdjuster {
  describe(): string;
  adjust(item: ScheduledFrequencyProfile, value: number): number;
}

export class ScheduledFrequencyProfileDiscountOffsetAdjuster implements ScheduledFrequencyProfileAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: ScheduledFrequencyProfile, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class TieredScheduledFrequencyProfileAdjuster implements ScheduledFrequencyProfileAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledFrequencyProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedScheduledFrequencyProfileAdjuster implements ScheduledFrequencyProfileAdjuster {
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

  adjust(item: ScheduledFrequencyProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled frequency profile steps in order and keeps a trace of each. */
export class ScheduledFrequencyProfileEngine {
  steps: ScheduledFrequencyProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledFrequencyProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledFrequencyProfile): number {
    let current = item.weightedValue();
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

  evaluateAll(items: ScheduledFrequencyProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledFrequencyProfileEngine(flagsValue: flags.Registry): ScheduledFrequencyProfileEngine {
  return new ScheduledFrequencyProfileEngine(
    [
      new ScheduledFrequencyProfileDiscountOffsetAdjuster(1.78),
      new TieredScheduledFrequencyProfileAdjuster([1402, 3104, 5826], [0.91, 0.91, 0.82]),
      new FlaggedScheduledFrequencyProfileAdjuster(flagsValue, "scheduled-frequency-profile-weighted", 6.8),
    ],
    [],
    0.6,
    38781.4,
  );
}
