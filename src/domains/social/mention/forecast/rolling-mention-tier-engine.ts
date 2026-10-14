import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingMentionTier } from "./rolling-mention-tier.js";

/** One step of the rolling mention tier calculation. */
export interface RollingMentionTierModifier {
  describe(): string;
  adjust(item: RollingMentionTier, value: number): number;
}

export class MinimumRollingMentionTierAdjuster implements RollingMentionTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingMentionTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRollingMentionTierAdjuster implements RollingMentionTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingMentionTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RollingMentionTierDiscountOffsetAdjuster implements RollingMentionTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: RollingMentionTier, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class FlaggedRollingMentionTierAdjuster implements RollingMentionTierModifier {
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

  adjust(item: RollingMentionTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingMentionTierAdjuster implements RollingMentionTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingMentionTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRollingMentionTierAdjuster implements RollingMentionTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingMentionTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling mention tier steps in order and keeps a trace of each. */
export class RollingMentionTierEngine {
  steps: RollingMentionTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingMentionTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingMentionTier): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RollingMentionTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingMentionTierEngine(flagsValue: flags.Registry): RollingMentionTierEngine {
  return new RollingMentionTierEngine(
    [
      new MinimumRollingMentionTierAdjuster(30.9),
      new RoundingRollingMentionTierAdjuster(5),
      new RollingMentionTierDiscountOffsetAdjuster(0.19),
      new FlaggedRollingMentionTierAdjuster(flagsValue, "rolling-mention-tier-global", -5.1),
      new TieredRollingMentionTierAdjuster([5200, 7911, 8210], [0.98, 1.11, 1.08]),
      new PercentRollingMentionTierAdjuster(-5.5),
    ],
    [],
    2.5,
    94730.7,
  );
}
