import * as numbers from "../../../../kit/numbers.js";
import { ModelTemplate } from "./model-template.js";

/** One step of the model template calculation. */
export interface ModelTemplateModifier {
  describe(): string;
  adjust(item: ModelTemplate, value: number): number;
}

export class TieredModelTemplateAdjuster implements ModelTemplateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentModelTemplateAdjuster implements ModelTemplateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ModelTemplateGraceDaysOffsetAdjuster implements ModelTemplateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ModelTemplate, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class RoundingModelTemplateAdjuster implements ModelTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ModelTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapModelTemplateAdjuster implements ModelTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the model template steps in order and keeps a trace of each. */
export class ModelTemplateEngine {
  steps: ModelTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ModelTemplate): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ModelTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultModelTemplateEngine(): ModelTemplateEngine {
  return new ModelTemplateEngine(
    [
      new TieredModelTemplateAdjuster([2799, 6541], [0.96, 0.87]),
      new PercentModelTemplateAdjuster(-21.1),
      new ModelTemplateGraceDaysOffsetAdjuster(1.11),
      new RoundingModelTemplateAdjuster(0.1),
      new CapModelTemplateAdjuster(2373),
    ],
    [],
    1.8,
    99413.1,
  );
}
