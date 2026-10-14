import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionTemplate } from "./conversion-template.js";

/** One step of the conversion template calculation. */
export interface ConversionTemplateFactor {
  describe(): string;
  adjust(item: ConversionTemplate, value: number): number;
}

export class RoundingConversionTemplateAdjuster implements ConversionTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ConversionTemplateBudgetOffsetAdjuster implements ConversionTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ConversionTemplate, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentConversionTemplateAdjuster implements ConversionTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapConversionTemplateAdjuster implements ConversionTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredConversionTemplateAdjuster implements ConversionTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedConversionTemplateAdjuster implements ConversionTemplateFactor {
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

  adjust(item: ConversionTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the conversion template steps in order and keeps a trace of each. */
export class ConversionTemplateEngine {
  steps: ConversionTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ConversionTemplate): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ConversionTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultConversionTemplateEngine(flagsValue: flags.Registry): ConversionTemplateEngine {
  return new ConversionTemplateEngine(
    [
      new RoundingConversionTemplateAdjuster(0.5),
      new ConversionTemplateBudgetOffsetAdjuster(1.95),
      new PercentConversionTemplateAdjuster(-6.8),
      new CapConversionTemplateAdjuster(2210),
      new TieredConversionTemplateAdjuster([828, 1971, 6395, 9653], [0.86, 1.05, 0.84, 0.88]),
      new FlaggedConversionTemplateAdjuster(flagsValue, "conversion-template-legacy", 7.2),
    ],
    [],
    3.3,
    66725.7,
  );
}
