import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightTemplate } from "./insight-template.js";

/** One step of the insight template calculation. */
export interface InsightTemplateModifier {
  describe(): string;
  adjust(item: InsightTemplate, value: number): number;
}

export class RoundingInsightTemplateAdjuster implements InsightTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumInsightTemplateAdjuster implements InsightTemplateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredInsightTemplateAdjuster implements InsightTemplateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentInsightTemplateAdjuster implements InsightTemplateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: InsightTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedInsightTemplateAdjuster implements InsightTemplateModifier {
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

  adjust(item: InsightTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the insight template steps in order and keeps a trace of each. */
export class InsightTemplateEngine {
  steps: InsightTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InsightTemplate): number {
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

  evaluateAll(items: InsightTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInsightTemplateEngine(flagsValue: flags.Registry): InsightTemplateEngine {
  return new InsightTemplateEngine(
    [
      new RoundingInsightTemplateAdjuster(5),
      new MinimumInsightTemplateAdjuster(27.7),
      new TieredInsightTemplateAdjuster([6265, 7810, 7850, 9792], [1.11, 0.88, 0.87, 0.99]),
      new SegmentInsightTemplateAdjuster(new Map<string, number>([["west", 0.9], ["south", 0.83]])),
      new FlaggedInsightTemplateAdjuster(flagsValue, "insight-template-regional", 4),
    ],
    [],
    3.6,
    67427,
  );
}
