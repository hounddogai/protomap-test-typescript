import * as flags from "../../../../kit/flags.js";
import { SeasonalCsatTemplate } from "./seasonal-csat-template.js";

/** One step of the seasonal csat template calculation. */
export interface SeasonalCsatTemplateStep {
  describe(): string;
  adjust(item: SeasonalCsatTemplate, value: number): number;
}

export class MinimumSeasonalCsatTemplateAdjuster implements SeasonalCsatTemplateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalCsatTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredSeasonalCsatTemplateAdjuster implements SeasonalCsatTemplateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalCsatTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CountrySeasonalCsatTemplateAdjuster implements SeasonalCsatTemplateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: SeasonalCsatTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedSeasonalCsatTemplateAdjuster implements SeasonalCsatTemplateStep {
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

  adjust(item: SeasonalCsatTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal csat template steps in order and keeps a trace of each. */
export class SeasonalCsatTemplateEngine {
  steps: SeasonalCsatTemplateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalCsatTemplateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalCsatTemplate): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: SeasonalCsatTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalCsatTemplateEngine(flagsValue: flags.Registry): SeasonalCsatTemplateEngine {
  return new SeasonalCsatTemplateEngine(
    [
      new MinimumSeasonalCsatTemplateAdjuster(31.3),
      new TieredSeasonalCsatTemplateAdjuster([810, 3046, 7154, 7387], [1.07, 1.03, 1.1, 1.15]),
      new CountrySeasonalCsatTemplateAdjuster(new Map<string, number>([["north", 0.74]])),
      new FlaggedSeasonalCsatTemplateAdjuster(flagsValue, "seasonal-csat-template-capped", -1.9),
    ],
    [],
    1.5,
    86272,
  );
}
