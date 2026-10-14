import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredModelTier } from "./tiered-model-tier.js";

/** One step of the tiered model tier calculation. */
export interface TieredModelTierModifier {
  describe(): string;
  adjust(item: TieredModelTier, value: number): number;
}

export class CategoryTieredModelTierAdjuster implements TieredModelTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: TieredModelTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTieredModelTierAdjuster implements TieredModelTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredModelTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTieredModelTierAdjuster implements TieredModelTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredModelTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTieredModelTierAdjuster implements TieredModelTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredModelTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTieredModelTierAdjuster implements TieredModelTierModifier {
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

  adjust(item: TieredModelTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered model tier steps in order and keeps a trace of each. */
export class TieredModelTierEngine {
  steps: TieredModelTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredModelTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredModelTier): number {
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

  evaluateAll(items: TieredModelTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredModelTierEngine(flagsValue: flags.Registry): TieredModelTierEngine {
  return new TieredModelTierEngine(
    [
      new CategoryTieredModelTierAdjuster(new Map<string, number>([["online", 1.16], ["east", 0.76]])),
      new MinimumTieredModelTierAdjuster(17.3),
      new RoundingTieredModelTierAdjuster(1),
      new PercentTieredModelTierAdjuster(12.4),
      new FlaggedTieredModelTierAdjuster(flagsValue, "tiered-model-tier-default", -1.2),
    ],
    [],
    2.5,
    17292.3,
  );
}
