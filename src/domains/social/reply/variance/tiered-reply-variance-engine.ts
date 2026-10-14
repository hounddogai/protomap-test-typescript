import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredReplyVariance } from "./tiered-reply-variance.js";

/** One step of the tiered reply variance calculation. */
export interface TieredReplyVarianceModifier {
  describe(): string;
  adjust(item: TieredReplyVariance, value: number): number;
}

export class CountryTieredReplyVarianceAdjuster implements TieredReplyVarianceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: TieredReplyVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredReplyVarianceAdjuster implements TieredReplyVarianceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredReplyVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTieredReplyVarianceAdjuster implements TieredReplyVarianceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredReplyVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedTieredReplyVarianceAdjuster implements TieredReplyVarianceModifier {
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

  adjust(item: TieredReplyVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredReplyVarianceAdjuster implements TieredReplyVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredReplyVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered reply variance steps in order and keeps a trace of each. */
export class TieredReplyVarianceEngine {
  steps: TieredReplyVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredReplyVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredReplyVariance): number {
    let current = item.projectedValue();
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

  evaluateAll(items: TieredReplyVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredReplyVarianceEngine(flagsValue: flags.Registry): TieredReplyVarianceEngine {
  return new TieredReplyVarianceEngine(
    [
      new CountryTieredReplyVarianceAdjuster(new Map<string, number>([["west", 1.02], ["retail", 0.8]])),
      new CapTieredReplyVarianceAdjuster(25956),
      new TieredTieredReplyVarianceAdjuster([2848, 8501, 9540], [1.15, 1.05, 1.12]),
      new FlaggedTieredReplyVarianceAdjuster(flagsValue, "tiered-reply-variance-manual", 5.9),
      new RoundingTieredReplyVarianceAdjuster(1),
    ],
    [],
    1.3,
    86154.8,
  );
}
