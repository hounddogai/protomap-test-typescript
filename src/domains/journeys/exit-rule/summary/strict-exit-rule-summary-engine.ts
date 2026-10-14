import * as flags from "../../../../kit/flags.js";
import { StrictExitRuleSummary } from "./strict-exit-rule-summary.js";

/** One step of the strict exit rule summary calculation. */
export interface StrictExitRuleSummaryModifier {
  describe(): string;
  adjust(item: StrictExitRuleSummary, value: number): number;
}

export class TieredStrictExitRuleSummaryAdjuster implements StrictExitRuleSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictExitRuleSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedStrictExitRuleSummaryAdjuster implements StrictExitRuleSummaryModifier {
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

  adjust(item: StrictExitRuleSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentStrictExitRuleSummaryAdjuster implements StrictExitRuleSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictExitRuleSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SegmentStrictExitRuleSummaryAdjuster implements StrictExitRuleSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: StrictExitRuleSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the strict exit rule summary steps in order and keeps a trace of each. */
export class StrictExitRuleSummaryEngine {
  steps: StrictExitRuleSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictExitRuleSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictExitRuleSummary): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: StrictExitRuleSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictExitRuleSummaryEngine(flagsValue: flags.Registry): StrictExitRuleSummaryEngine {
  return new StrictExitRuleSummaryEngine(
    [
      new TieredStrictExitRuleSummaryAdjuster([6225, 6945, 7884], [1.1, 0.92, 1.2]),
      new FlaggedStrictExitRuleSummaryAdjuster(flagsValue, "strict-exit-rule-summary-weighted", -1.5),
      new PercentStrictExitRuleSummaryAdjuster(11.4),
      new SegmentStrictExitRuleSummaryAdjuster(new Map<string, number>([["online", 1], ["west", 0.79]])),
    ],
    [],
    2.9,
    75043.9,
  );
}
