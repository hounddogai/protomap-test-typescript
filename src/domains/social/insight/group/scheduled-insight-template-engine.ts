import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledInsightTemplate } from "./scheduled-insight-template.js";

/** One step of the scheduled insight template calculation. */
export interface ScheduledInsightTemplateFactor {
  describe(): string;
  adjust(item: ScheduledInsightTemplate, value: number): number;
}

export class CapScheduledInsightTemplateAdjuster implements ScheduledInsightTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledInsightTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredScheduledInsightTemplateAdjuster implements ScheduledInsightTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledInsightTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UnitScheduledInsightTemplateAdjuster implements ScheduledInsightTemplateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: ScheduledInsightTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentScheduledInsightTemplateAdjuster implements ScheduledInsightTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledInsightTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedScheduledInsightTemplateAdjuster implements ScheduledInsightTemplateFactor {
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

  adjust(item: ScheduledInsightTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled insight template steps in order and keeps a trace of each. */
export class ScheduledInsightTemplateEngine {
  steps: ScheduledInsightTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledInsightTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledInsightTemplate): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: ScheduledInsightTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledInsightTemplateEngine(flagsValue: flags.Registry): ScheduledInsightTemplateEngine {
  return new ScheduledInsightTemplateEngine(
    [
      new CapScheduledInsightTemplateAdjuster(30089),
      new TieredScheduledInsightTemplateAdjuster([272, 2595, 2964, 8951], [1.05, 1.08, 0.97, 0.9]),
      new UnitScheduledInsightTemplateAdjuster(
        new Map<string, number>([["north", 1.18], ["south", 0.72], ["online", 1.25]]),
      ),
      new PercentScheduledInsightTemplateAdjuster(23.1),
      new FlaggedScheduledInsightTemplateAdjuster(flagsValue, "scheduled-insight-template-default", -8.9),
    ],
    [],
    4.3,
    83519,
  );
}
