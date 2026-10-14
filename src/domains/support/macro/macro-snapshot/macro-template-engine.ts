import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MacroTemplate } from "./macro-template.js";

/** One step of the macro template calculation. */
export interface MacroTemplateFactor {
  describe(): string;
  adjust(item: MacroTemplate, value: number): number;
}

export class RoundingMacroTemplateAdjuster implements MacroTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MacroTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedMacroTemplateAdjuster implements MacroTemplateFactor {
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

  adjust(item: MacroTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentMacroTemplateAdjuster implements MacroTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MacroTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredMacroTemplateAdjuster implements MacroTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MacroTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapMacroTemplateAdjuster implements MacroTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MacroTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the macro template steps in order and keeps a trace of each. */
export class MacroTemplateEngine {
  steps: MacroTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MacroTemplate): number {
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

  evaluateAll(items: MacroTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMacroTemplateEngine(flagsValue: flags.Registry): MacroTemplateEngine {
  return new MacroTemplateEngine(
    [
      new RoundingMacroTemplateAdjuster(0.05),
      new FlaggedMacroTemplateAdjuster(flagsValue, "macro-template-primary", 5.8),
      new PercentMacroTemplateAdjuster(15.4),
      new TieredMacroTemplateAdjuster([9400, 9645], [0.87, 1.14]),
      new CapMacroTemplateAdjuster(45508),
    ],
    [],
    1.9,
    90424.5,
  );
}
