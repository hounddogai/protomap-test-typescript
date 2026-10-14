import * as numbers from "../../../../kit/numbers.js";
import { StreakTemplate } from "./streak-template.js";

/** One step of the streak template calculation. */
export interface StreakTemplateFactor {
  describe(): string;
  adjust(item: StreakTemplate, value: number): number;
}

export class StreakTemplateCreatedAtOffsetAdjuster implements StreakTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: StreakTemplate, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class CapStreakTemplateAdjuster implements StreakTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionStreakTemplateAdjuster implements StreakTemplateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: StreakTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the streak template steps in order and keeps a trace of each. */
export class StreakTemplateEngine {
  steps: StreakTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StreakTemplate): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: StreakTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStreakTemplateEngine(): StreakTemplateEngine {
  return new StreakTemplateEngine(
    [
      new StreakTemplateCreatedAtOffsetAdjuster(0.43),
      new CapStreakTemplateAdjuster(19056),
      new RegionStreakTemplateAdjuster(
        new Map<string, number>([["central", 0.83], ["north", 0.76], ["south", 1.1]]),
      ),
    ],
    [],
    3,
    67584.9,
  );
}
