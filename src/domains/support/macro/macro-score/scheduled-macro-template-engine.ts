import * as numbers from "../../../../kit/numbers.js";
import { ScheduledMacroTemplate } from "./scheduled-macro-template.js";

/** One step of the scheduled macro template calculation. */
export interface ScheduledMacroTemplateFactor {
  describe(): string;
  adjust(item: ScheduledMacroTemplate, value: number): number;
}

export class NameScheduledMacroTemplateAdjuster implements ScheduledMacroTemplateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ScheduledMacroTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingScheduledMacroTemplateAdjuster implements ScheduledMacroTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledMacroTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredScheduledMacroTemplateAdjuster implements ScheduledMacroTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledMacroTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumScheduledMacroTemplateAdjuster implements ScheduledMacroTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledMacroTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled macro template steps in order and keeps a trace of each. */
export class ScheduledMacroTemplateEngine {
  steps: ScheduledMacroTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledMacroTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledMacroTemplate): number {
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

  evaluateAll(items: ScheduledMacroTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledMacroTemplateEngine(): ScheduledMacroTemplateEngine {
  return new ScheduledMacroTemplateEngine(
    [
      new NameScheduledMacroTemplateAdjuster(new Map<string, number>([["north", 0.85], ["south", 0.96]])),
      new RoundingScheduledMacroTemplateAdjuster(1),
      new TieredScheduledMacroTemplateAdjuster([4251, 8975], [1.05, 1.13]),
      new MinimumScheduledMacroTemplateAdjuster(4.7),
    ],
    [],
    0.6,
    14918.2,
  );
}
