import * as flags from "../../../../kit/flags.js";
import { AdaptivePaywallTemplate } from "./adaptive-paywall-template.js";

/** One step of the adaptive paywall template calculation. */
export interface AdaptivePaywallTemplateModifier {
  describe(): string;
  adjust(item: AdaptivePaywallTemplate, value: number): number;
}

export class FlaggedAdaptivePaywallTemplateAdjuster implements AdaptivePaywallTemplateModifier {
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

  adjust(item: AdaptivePaywallTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptivePaywallTemplateAdjuster implements AdaptivePaywallTemplateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptivePaywallTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleAdaptivePaywallTemplateAdjuster implements AdaptivePaywallTemplateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: AdaptivePaywallTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class AdaptivePaywallTemplateAttemptsOffsetAdjuster implements AdaptivePaywallTemplateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: AdaptivePaywallTemplate, value: number): number {
    return value + item.attempts * this.weight;
  }
}

/** Runs the adaptive paywall template steps in order and keeps a trace of each. */
export class AdaptivePaywallTemplateEngine {
  steps: AdaptivePaywallTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptivePaywallTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptivePaywallTemplate): number {
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

  evaluateAll(items: AdaptivePaywallTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptivePaywallTemplateEngine(flagsValue: flags.Registry): AdaptivePaywallTemplateEngine {
  return new AdaptivePaywallTemplateEngine(
    [
      new FlaggedAdaptivePaywallTemplateAdjuster(flagsValue, "adaptive-paywall-template-strict", -0.9),
      new TieredAdaptivePaywallTemplateAdjuster([2639, 3450, 8616], [1.19, 1.12, 1.12]),
      new LocaleAdaptivePaywallTemplateAdjuster(new Map<string, number>([["south", 1.07]])),
      new AdaptivePaywallTemplateAttemptsOffsetAdjuster(0.21),
    ],
    [],
    1.3,
    44933.4,
  );
}
