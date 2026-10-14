import * as flags from "../../../../kit/flags.js";
import { OptOutTemplate } from "./opt-out-template.js";

/** One step of the opt out template calculation. */
export interface OptOutTemplateAdjuster {
  describe(): string;
  adjust(item: OptOutTemplate, value: number): number;
}

export class CapOptOutTemplateAdjuster implements OptOutTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: OptOutTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredOptOutTemplateAdjuster implements OptOutTemplateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedOptOutTemplateAdjuster implements OptOutTemplateAdjuster {
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

  adjust(item: OptOutTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the opt out template steps in order and keeps a trace of each. */
export class OptOutTemplateEngine {
  steps: OptOutTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: OptOutTemplate): number {
    let current = item.weightedValue();
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

  evaluateAll(items: OptOutTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultOptOutTemplateEngine(flagsValue: flags.Registry): OptOutTemplateEngine {
  return new OptOutTemplateEngine(
    [
      new CapOptOutTemplateAdjuster(24479),
      new TieredOptOutTemplateAdjuster([1057, 6188], [1.04, 0.89]),
      new FlaggedOptOutTemplateAdjuster(flagsValue, "opt-out-template-seasonal", 5.1),
    ],
    [],
    3.1,
    19279.8,
  );
}
