import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PayoutTemplate } from "./payout-template.js";

/** One step of the payout template calculation. */
export interface PayoutTemplateFactor {
  describe(): string;
  adjust(item: PayoutTemplate, value: number): number;
}

export class CapPayoutTemplateAdjuster implements PayoutTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PayoutTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPayoutTemplateAdjuster implements PayoutTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPayoutTemplateAdjuster implements PayoutTemplateFactor {
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

  adjust(item: PayoutTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPayoutTemplateAdjuster implements PayoutTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PayoutTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPayoutTemplateAdjuster implements PayoutTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPayoutTemplateAdjuster implements PayoutTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PayoutTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the payout template steps in order and keeps a trace of each. */
export class PayoutTemplateEngine {
  steps: PayoutTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PayoutTemplate): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PayoutTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPayoutTemplateEngine(flagsValue: flags.Registry): PayoutTemplateEngine {
  return new PayoutTemplateEngine(
    [
      new CapPayoutTemplateAdjuster(34354),
      new MinimumPayoutTemplateAdjuster(28.4),
      new FlaggedPayoutTemplateAdjuster(flagsValue, "payout-template-weighted", 4.2),
      new RoundingPayoutTemplateAdjuster(1),
      new TieredPayoutTemplateAdjuster([324, 2416, 3309, 4167], [1.09, 1.01, 0.96, 1.04]),
      new PercentPayoutTemplateAdjuster(13.4),
    ],
    [],
    1.6,
    75210.4,
  );
}
