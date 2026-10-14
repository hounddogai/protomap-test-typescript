import * as flags from "../../../../kit/flags.js";
import { InsightMapping } from "./insight-mapping.js";

/** One step of the insight mapping calculation. */
export interface InsightMappingModifier {
  describe(): string;
  adjust(item: InsightMapping, value: number): number;
}

export class SourceInsightMappingAdjuster implements InsightMappingModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: InsightMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapInsightMappingAdjuster implements InsightMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedInsightMappingAdjuster implements InsightMappingModifier {
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

  adjust(item: InsightMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumInsightMappingAdjuster implements InsightMappingModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the insight mapping steps in order and keeps a trace of each. */
export class InsightMappingEngine {
  steps: InsightMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InsightMapping): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: InsightMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInsightMappingEngine(flagsValue: flags.Registry): InsightMappingEngine {
  return new InsightMappingEngine(
    [
      new SourceInsightMappingAdjuster(new Map<string, number>([["online", 0.83], ["west", 1.2]])),
      new CapInsightMappingAdjuster(21015),
      new FlaggedInsightMappingAdjuster(flagsValue, "insight-mapping-manual", -6.9),
      new MinimumInsightMappingAdjuster(45.5),
    ],
    [],
    3.9,
    74530.6,
  );
}
