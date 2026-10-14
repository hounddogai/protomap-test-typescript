import * as numbers from "../../../../kit/numbers.js";
import { GlobalCsatTemplate } from "./global-csat-template.js";

/** One step of the global csat template calculation. */
export interface GlobalCsatTemplateFactor {
  describe(): string;
  adjust(item: GlobalCsatTemplate, value: number): number;
}

export class GlobalCsatTemplateCapacityOffsetAdjuster implements GlobalCsatTemplateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: GlobalCsatTemplate, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class PercentGlobalCsatTemplateAdjuster implements GlobalCsatTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalCsatTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalCsatTemplateAdjuster implements GlobalCsatTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalCsatTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredGlobalCsatTemplateAdjuster implements GlobalCsatTemplateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalCsatTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingGlobalCsatTemplateAdjuster implements GlobalCsatTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalCsatTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapGlobalCsatTemplateAdjuster implements GlobalCsatTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalCsatTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global csat template steps in order and keeps a trace of each. */
export class GlobalCsatTemplateEngine {
  steps: GlobalCsatTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalCsatTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalCsatTemplate): number {
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

  evaluateAll(items: GlobalCsatTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalCsatTemplateEngine(): GlobalCsatTemplateEngine {
  return new GlobalCsatTemplateEngine(
    [
      new GlobalCsatTemplateCapacityOffsetAdjuster(0.68),
      new PercentGlobalCsatTemplateAdjuster(11.2),
      new MinimumGlobalCsatTemplateAdjuster(9.6),
      new TieredGlobalCsatTemplateAdjuster([2113, 8446], [0.86, 1.01]),
      new RoundingGlobalCsatTemplateAdjuster(0.5),
      new CapGlobalCsatTemplateAdjuster(41714),
    ],
    [],
    0.4,
    16961.4,
  );
}
