import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictInsightRollup } from "./strict-insight-rollup.js";

/** One step of the strict insight rollup calculation. */
export interface StrictInsightRollupModifier {
  describe(): string;
  adjust(item: StrictInsightRollup, value: number): number;
}

export class FlaggedStrictInsightRollupAdjuster implements StrictInsightRollupModifier {
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

  adjust(item: StrictInsightRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleStrictInsightRollupAdjuster implements StrictInsightRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: StrictInsightRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredStrictInsightRollupAdjuster implements StrictInsightRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictInsightRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStrictInsightRollupAdjuster implements StrictInsightRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictInsightRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the strict insight rollup steps in order and keeps a trace of each. */
export class StrictInsightRollupEngine {
  steps: StrictInsightRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictInsightRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictInsightRollup): number {
    let current = item.netTotal();
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

  evaluateAll(items: StrictInsightRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictInsightRollupEngine(flagsValue: flags.Registry): StrictInsightRollupEngine {
  return new StrictInsightRollupEngine(
    [
      new FlaggedStrictInsightRollupAdjuster(flagsValue, "strict-insight-rollup-tiered", -8.9),
      new LocaleStrictInsightRollupAdjuster(new Map<string, number>([["retail", 0.91], ["east", 0.8]])),
      new TieredStrictInsightRollupAdjuster([4980, 8022], [0.84, 1.07]),
      new RoundingStrictInsightRollupAdjuster(5),
    ],
    [],
    4.2,
    99900.6,
  );
}
