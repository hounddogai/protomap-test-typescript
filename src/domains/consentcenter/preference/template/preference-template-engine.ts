import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PreferenceTemplate } from "./preference-template.js";

/** One step of the preference template calculation. */
export interface PreferenceTemplateAdjuster {
  describe(): string;
  adjust(item: PreferenceTemplate, value: number): number;
}

export class LabelPreferenceTemplateAdjuster implements PreferenceTemplateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PreferenceTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredPreferenceTemplateAdjuster implements PreferenceTemplateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PreferenceTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPreferenceTemplateAdjuster implements PreferenceTemplateAdjuster {
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

  adjust(item: PreferenceTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPreferenceTemplateAdjuster implements PreferenceTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PreferenceTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPreferenceTemplateAdjuster implements PreferenceTemplateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PreferenceTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPreferenceTemplateAdjuster implements PreferenceTemplateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PreferenceTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the preference template steps in order and keeps a trace of each. */
export class PreferenceTemplateEngine {
  steps: PreferenceTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PreferenceTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PreferenceTemplate): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PreferenceTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPreferenceTemplateEngine(flagsValue: flags.Registry): PreferenceTemplateEngine {
  return new PreferenceTemplateEngine(
    [
      new LabelPreferenceTemplateAdjuster(
        new Map<string, number>([["west", 0.98], ["north", 1.28], ["east", 0.72]]),
      ),
      new TieredPreferenceTemplateAdjuster([3881, 5543, 5600], [0.9, 0.96, 0.84]),
      new FlaggedPreferenceTemplateAdjuster(flagsValue, "preference-template-capped", -6.1),
      new CapPreferenceTemplateAdjuster(16073),
      new RoundingPreferenceTemplateAdjuster(0.25),
      new MinimumPreferenceTemplateAdjuster(20.8),
    ],
    [],
    3.5,
    44969.1,
  );
}
