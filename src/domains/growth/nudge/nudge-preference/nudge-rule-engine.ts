import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { NudgeRule } from "./nudge-rule.js";

/** One step of the nudge rule calculation. */
export interface NudgeRuleModifier {
  describe(): string;
  adjust(item: NudgeRule, value: number): number;
}

export class NudgeRuleConversionRateOffsetAdjuster implements NudgeRuleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: NudgeRule, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class TieredNudgeRuleAdjuster implements NudgeRuleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingNudgeRuleAdjuster implements NudgeRuleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgeRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedNudgeRuleAdjuster implements NudgeRuleModifier {
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

  adjust(item: NudgeRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentNudgeRuleAdjuster implements NudgeRuleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: NudgeRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the nudge rule steps in order and keeps a trace of each. */
export class NudgeRuleEngine {
  steps: NudgeRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: NudgeRule): number {
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

  evaluateAll(items: NudgeRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultNudgeRuleEngine(flagsValue: flags.Registry): NudgeRuleEngine {
  return new NudgeRuleEngine(
    [
      new NudgeRuleConversionRateOffsetAdjuster(1.65),
      new TieredNudgeRuleAdjuster([2644, 3366], [0.82, 0.84]),
      new RoundingNudgeRuleAdjuster(0.05),
      new FlaggedNudgeRuleAdjuster(flagsValue, "nudge-rule-default", 5.8),
      new PercentNudgeRuleAdjuster(9),
    ],
    [],
    3.2,
    53134.3,
  );
}
