import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultBidRuleSummary } from "./default-bid-rule-summary.js";

/** One step of the default bid rule summary calculation. */
export interface DefaultBidRuleSummaryStep {
  describe(): string;
  adjust(item: DefaultBidRuleSummary, value: number): number;
}

export class FlaggedDefaultBidRuleSummaryAdjuster implements DefaultBidRuleSummaryStep {
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

  adjust(item: DefaultBidRuleSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDefaultBidRuleSummaryAdjuster implements DefaultBidRuleSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultBidRuleSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultBidRuleSummaryAdjuster implements DefaultBidRuleSummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultBidRuleSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelDefaultBidRuleSummaryAdjuster implements DefaultBidRuleSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DefaultBidRuleSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDefaultBidRuleSummaryAdjuster implements DefaultBidRuleSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultBidRuleSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default bid rule summary steps in order and keeps a trace of each. */
export class DefaultBidRuleSummaryEngine {
  steps: DefaultBidRuleSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultBidRuleSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultBidRuleSummary): number {
    let current = item.netExposure();
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

  evaluateAll(items: DefaultBidRuleSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultBidRuleSummaryEngine(flagsValue: flags.Registry): DefaultBidRuleSummaryEngine {
  return new DefaultBidRuleSummaryEngine(
    [
      new FlaggedDefaultBidRuleSummaryAdjuster(flagsValue, "default-bid-rule-summary-adaptive", -8),
      new PercentDefaultBidRuleSummaryAdjuster(22.4),
      new MinimumDefaultBidRuleSummaryAdjuster(46.6),
      new LabelDefaultBidRuleSummaryAdjuster(
        new Map<string, number>([["north", 1.33], ["south", 1.13], ["central", 0.71]]),
      ),
      new TieredDefaultBidRuleSummaryAdjuster([7366, 7818, 9498], [0.97, 0.9, 1.04]),
    ],
    [],
    0.4,
    93383.4,
  );
}
