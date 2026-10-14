import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FunnelTemplate } from "./funnel-template.js";

/** One step of the funnel template calculation. */
export interface FunnelTemplateFactor {
  describe(): string;
  adjust(item: FunnelTemplate, value: number): number;
}

export class RoundingFunnelTemplateAdjuster implements FunnelTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFunnelTemplateAdjuster implements FunnelTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFunnelTemplateAdjuster implements FunnelTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedFunnelTemplateAdjuster implements FunnelTemplateFactor {
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

  adjust(item: FunnelTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFunnelTemplateAdjuster implements FunnelTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFunnelTemplateAdjuster implements FunnelTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the funnel template steps in order and keeps a trace of each. */
export class FunnelTemplateEngine {
  steps: FunnelTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FunnelTemplate): number {
    let current = item.projectedValue();
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

  evaluateAll(items: FunnelTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFunnelTemplateEngine(flagsValue: flags.Registry): FunnelTemplateEngine {
  return new FunnelTemplateEngine(
    [
      new RoundingFunnelTemplateAdjuster(0.05),
      new TieredFunnelTemplateAdjuster([321, 7525, 9901], [1.14, 1.17, 1.07]),
      new CapFunnelTemplateAdjuster(41869),
      new FlaggedFunnelTemplateAdjuster(flagsValue, "funnel-template-fallback", -1.3),
      new MinimumFunnelTemplateAdjuster(46),
      new PercentFunnelTemplateAdjuster(7.7),
    ],
    [],
    2.8,
    40805.3,
  );
}
