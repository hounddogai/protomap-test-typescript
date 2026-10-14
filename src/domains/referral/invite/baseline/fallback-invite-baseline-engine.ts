import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackInviteBaseline } from "./fallback-invite-baseline.js";

/** One step of the fallback invite baseline calculation. */
export interface FallbackInviteBaselineAdjuster {
  describe(): string;
  adjust(item: FallbackInviteBaseline, value: number): number;
}

export class FlaggedFallbackInviteBaselineAdjuster implements FallbackInviteBaselineAdjuster {
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

  adjust(item: FallbackInviteBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FallbackInviteBaselineWindowDaysOffsetAdjuster implements FallbackInviteBaselineAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: FallbackInviteBaseline, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class RoundingFallbackInviteBaselineAdjuster implements FallbackInviteBaselineAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackInviteBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFallbackInviteBaselineAdjuster implements FallbackInviteBaselineAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackInviteBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredFallbackInviteBaselineAdjuster implements FallbackInviteBaselineAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackInviteBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelFallbackInviteBaselineAdjuster implements FallbackInviteBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FallbackInviteBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fallback invite baseline steps in order and keeps a trace of each. */
export class FallbackInviteBaselineEngine {
  steps: FallbackInviteBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackInviteBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackInviteBaseline): number {
    let current = item.netValue();
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

  evaluateAll(items: FallbackInviteBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackInviteBaselineEngine(flagsValue: flags.Registry): FallbackInviteBaselineEngine {
  return new FallbackInviteBaselineEngine(
    [
      new FlaggedFallbackInviteBaselineAdjuster(flagsValue, "fallback-invite-baseline-scheduled", -0.9),
      new FallbackInviteBaselineWindowDaysOffsetAdjuster(1.31),
      new RoundingFallbackInviteBaselineAdjuster(0.1),
      new PercentFallbackInviteBaselineAdjuster(-4.4),
      new TieredFallbackInviteBaselineAdjuster([1711, 2532, 3237, 8997], [1.07, 0.98, 1, 0.96]),
      new ChannelFallbackInviteBaselineAdjuster(new Map<string, number>([["east", 1.24], ["north", 0.75]])),
    ],
    [],
    2.5,
    71501.1,
  );
}
