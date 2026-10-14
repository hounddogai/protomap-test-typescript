import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PaywallTemplate } from "./paywall-template.js";

/** One step of the paywall template calculation. */
export interface PaywallTemplateFactor {
  describe(): string;
  adjust(item: PaywallTemplate, value: number): number;
}

export class PercentPaywallTemplateAdjuster implements PaywallTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PaywallTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPaywallTemplateAdjuster implements PaywallTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPaywallTemplateAdjuster implements PaywallTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPaywallTemplateAdjuster implements PaywallTemplateFactor {
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

  adjust(item: PaywallTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PaywallTemplateBudgetOffsetAdjuster implements PaywallTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: PaywallTemplate, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the paywall template steps in order and keeps a trace of each. */
export class PaywallTemplateEngine {
  steps: PaywallTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PaywallTemplate): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PaywallTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPaywallTemplateEngine(flagsValue: flags.Registry): PaywallTemplateEngine {
  return new PaywallTemplateEngine(
    [
      new PercentPaywallTemplateAdjuster(2.1),
      new MinimumPaywallTemplateAdjuster(1.6),
      new CapPaywallTemplateAdjuster(44719),
      new FlaggedPaywallTemplateAdjuster(flagsValue, "paywall-template-adaptive", -7.1),
      new PaywallTemplateBudgetOffsetAdjuster(1.29),
    ],
    [],
    1.4,
    85186,
  );
}
