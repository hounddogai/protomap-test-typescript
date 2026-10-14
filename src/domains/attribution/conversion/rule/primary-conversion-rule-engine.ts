import * as flags from "../../../../kit/flags.js";
import { PrimaryConversionRule } from "./primary-conversion-rule.js";

/** One step of the primary conversion rule calculation. */
export interface PrimaryConversionRuleFactor {
  describe(): string;
  adjust(item: PrimaryConversionRule, value: number): number;
}

export class FlaggedPrimaryConversionRuleAdjuster implements PrimaryConversionRuleFactor {
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

  adjust(item: PrimaryConversionRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitlePrimaryConversionRuleAdjuster implements PrimaryConversionRuleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PrimaryConversionRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPrimaryConversionRuleAdjuster implements PrimaryConversionRuleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryConversionRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the primary conversion rule steps in order and keeps a trace of each. */
export class PrimaryConversionRuleEngine {
  steps: PrimaryConversionRuleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryConversionRuleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryConversionRule): number {
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

  evaluateAll(items: PrimaryConversionRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryConversionRuleEngine(flagsValue: flags.Registry): PrimaryConversionRuleEngine {
  return new PrimaryConversionRuleEngine(
    [
      new FlaggedPrimaryConversionRuleAdjuster(flagsValue, "primary-conversion-rule-pending", 7.4),
      new TitlePrimaryConversionRuleAdjuster(new Map<string, number>([["online", 0.76], ["west", 0.93]])),
      new TieredPrimaryConversionRuleAdjuster([139, 2167, 5294, 8792], [0.99, 0.82, 1.02, 0.92]),
    ],
    [],
    4.4,
    53327.3,
  );
}
