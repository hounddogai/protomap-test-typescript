import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CsatTemplate } from "./csat-template.js";

/** One step of the csat template calculation. */
export interface CsatTemplateModifier {
  describe(): string;
  adjust(item: CsatTemplate, value: number): number;
}

export class CapCsatTemplateAdjuster implements CsatTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCsatTemplateAdjuster implements CsatTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CsatTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCsatTemplateAdjuster implements CsatTemplateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCsatTemplateAdjuster implements CsatTemplateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCsatTemplateAdjuster implements CsatTemplateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CsatTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedCsatTemplateAdjuster implements CsatTemplateModifier {
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

  adjust(item: CsatTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the csat template steps in order and keeps a trace of each. */
export class CsatTemplateEngine {
  steps: CsatTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CsatTemplate): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: CsatTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCsatTemplateEngine(flagsValue: flags.Registry): CsatTemplateEngine {
  return new CsatTemplateEngine(
    [
      new CapCsatTemplateAdjuster(23235),
      new RoundingCsatTemplateAdjuster(0.25),
      new PercentCsatTemplateAdjuster(16.1),
      new TieredCsatTemplateAdjuster([2078, 7652, 8563, 9879], [0.97, 0.89, 1.19, 1.02]),
      new MinimumCsatTemplateAdjuster(8),
      new FlaggedCsatTemplateAdjuster(flagsValue, "csat-template-rolling", -5.8),
    ],
    [],
    1.1,
    60395.7,
  );
}
