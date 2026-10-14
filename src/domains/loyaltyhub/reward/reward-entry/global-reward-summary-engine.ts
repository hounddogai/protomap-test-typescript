import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalRewardSummary } from "./global-reward-summary.js";

/** One step of the global reward summary calculation. */
export interface GlobalRewardSummaryModifier {
  describe(): string;
  adjust(item: GlobalRewardSummary, value: number): number;
}

export class FlaggedGlobalRewardSummaryAdjuster implements GlobalRewardSummaryModifier {
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

  adjust(item: GlobalRewardSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalRewardSummaryAdjuster implements GlobalRewardSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalRewardSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingGlobalRewardSummaryAdjuster implements GlobalRewardSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalRewardSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RegionGlobalRewardSummaryAdjuster implements GlobalRewardSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: GlobalRewardSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global reward summary steps in order and keeps a trace of each. */
export class GlobalRewardSummaryEngine {
  steps: GlobalRewardSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRewardSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalRewardSummary): number {
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

  evaluateAll(items: GlobalRewardSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalRewardSummaryEngine(flagsValue: flags.Registry): GlobalRewardSummaryEngine {
  return new GlobalRewardSummaryEngine(
    [
      new FlaggedGlobalRewardSummaryAdjuster(flagsValue, "global-reward-summary-lenient", 9.5),
      new TieredGlobalRewardSummaryAdjuster([5740, 8504], [1.06, 0.92]),
      new RoundingGlobalRewardSummaryAdjuster(0.05),
      new RegionGlobalRewardSummaryAdjuster(
        new Map<string, number>([["retail", 1.1], ["online", 1.33], ["north", 1.25]]),
      ),
    ],
    [],
    4.3,
    20317.3,
  );
}
