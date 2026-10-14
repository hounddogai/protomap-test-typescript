import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveSenderTemplate } from "./adaptive-sender-template.js";

/** One step of the adaptive sender template calculation. */
export interface AdaptiveSenderTemplateStep {
  describe(): string;
  adjust(item: AdaptiveSenderTemplate, value: number): number;
}

export class TieredAdaptiveSenderTemplateAdjuster implements AdaptiveSenderTemplateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveSenderTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedAdaptiveSenderTemplateAdjuster implements AdaptiveSenderTemplateStep {
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

  adjust(item: AdaptiveSenderTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveSenderTemplateAdjuster implements AdaptiveSenderTemplateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveSenderTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveSenderTemplateSendAtOffsetAdjuster implements AdaptiveSenderTemplateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: AdaptiveSenderTemplate, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

/** Runs the adaptive sender template steps in order and keeps a trace of each. */
export class AdaptiveSenderTemplateEngine {
  steps: AdaptiveSenderTemplateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveSenderTemplateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveSenderTemplate): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: AdaptiveSenderTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveSenderTemplateEngine(flagsValue: flags.Registry): AdaptiveSenderTemplateEngine {
  return new AdaptiveSenderTemplateEngine(
    [
      new TieredAdaptiveSenderTemplateAdjuster([9285, 9893], [1.12, 1.06]),
      new FlaggedAdaptiveSenderTemplateAdjuster(flagsValue, "adaptive-sender-template-batched", -7.3),
      new RoundingAdaptiveSenderTemplateAdjuster(0.1),
      new AdaptiveSenderTemplateSendAtOffsetAdjuster(0.62),
    ],
    [],
    4.7,
    81371.3,
  );
}
