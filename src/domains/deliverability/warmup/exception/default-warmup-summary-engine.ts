import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultWarmupSummary } from "./default-warmup-summary.js";

/** One step of the default warmup summary calculation. */
export interface DefaultWarmupSummaryModifier {
  describe(): string;
  adjust(item: DefaultWarmupSummary, value: number): number;
}

export class MinimumDefaultWarmupSummaryAdjuster implements DefaultWarmupSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultWarmupSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class DefaultWarmupSummaryEndsAtOffsetAdjuster implements DefaultWarmupSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: DefaultWarmupSummary, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class RoundingDefaultWarmupSummaryAdjuster implements DefaultWarmupSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultWarmupSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedDefaultWarmupSummaryAdjuster implements DefaultWarmupSummaryModifier {
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

  adjust(item: DefaultWarmupSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultWarmupSummaryAdjuster implements DefaultWarmupSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultWarmupSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleDefaultWarmupSummaryAdjuster implements DefaultWarmupSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: DefaultWarmupSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default warmup summary steps in order and keeps a trace of each. */
export class DefaultWarmupSummaryEngine {
  steps: DefaultWarmupSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultWarmupSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultWarmupSummary): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: DefaultWarmupSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultWarmupSummaryEngine(flagsValue: flags.Registry): DefaultWarmupSummaryEngine {
  return new DefaultWarmupSummaryEngine(
    [
      new MinimumDefaultWarmupSummaryAdjuster(27.4),
      new DefaultWarmupSummaryEndsAtOffsetAdjuster(1.35),
      new RoundingDefaultWarmupSummaryAdjuster(5),
      new FlaggedDefaultWarmupSummaryAdjuster(flagsValue, "default-warmup-summary-fallback", -8.9),
      new TieredDefaultWarmupSummaryAdjuster([1285, 3504, 3592, 7198], [1.18, 1.04, 1.18, 1.19]),
      new LocaleDefaultWarmupSummaryAdjuster(new Map<string, number>([["south", 1.15]])),
    ],
    [],
    4.9,
    35446.4,
  );
}
