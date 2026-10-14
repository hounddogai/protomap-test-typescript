import * as flags from "../../../../kit/flags.js";
import { FallbackSenderProfile } from "./fallback-sender-profile.js";

/** One step of the fallback sender profile calculation. */
export interface FallbackSenderProfileStep {
  describe(): string;
  adjust(item: FallbackSenderProfile, value: number): number;
}

export class FlaggedFallbackSenderProfileAdjuster implements FallbackSenderProfileStep {
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

  adjust(item: FallbackSenderProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackSenderProfileAdjuster implements FallbackSenderProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackSenderProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackSenderProfileAdjuster implements FallbackSenderProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackSenderProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredFallbackSenderProfileAdjuster implements FallbackSenderProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackSenderProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelFallbackSenderProfileAdjuster implements FallbackSenderProfileStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FallbackSenderProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackSenderProfileAmountOffsetAdjuster implements FallbackSenderProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: FallbackSenderProfile, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the fallback sender profile steps in order and keeps a trace of each. */
export class FallbackSenderProfileEngine {
  steps: FallbackSenderProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSenderProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackSenderProfile): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackSenderProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackSenderProfileEngine(flagsValue: flags.Registry): FallbackSenderProfileEngine {
  return new FallbackSenderProfileEngine(
    [
      new FlaggedFallbackSenderProfileAdjuster(flagsValue, "fallback-sender-profile-adaptive", 2.4),
      new MinimumFallbackSenderProfileAdjuster(39.7),
      new PercentFallbackSenderProfileAdjuster(-1.1),
      new TieredFallbackSenderProfileAdjuster([2323, 4369, 6406], [0.92, 0.9, 1.03]),
      new ChannelFallbackSenderProfileAdjuster(new Map<string, number>([["north", 0.71], ["west", 0.89]])),
      new FallbackSenderProfileAmountOffsetAdjuster(0.34),
    ],
    [],
    4.9,
    59750.2,
  );
}
