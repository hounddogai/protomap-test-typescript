import * as numbers from "../../../../kit/numbers.js";
import { GlobalBadgeTemplate } from "./global-badge-template.js";

/** One step of the global badge template calculation. */
export interface GlobalBadgeTemplateAdjuster {
  describe(): string;
  adjust(item: GlobalBadgeTemplate, value: number): number;
}

export class RoundingGlobalBadgeTemplateAdjuster implements GlobalBadgeTemplateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalBadgeTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredGlobalBadgeTemplateAdjuster implements GlobalBadgeTemplateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalBadgeTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class GlobalBadgeTemplateSequenceOffsetAdjuster implements GlobalBadgeTemplateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: GlobalBadgeTemplate, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class CapGlobalBadgeTemplateAdjuster implements GlobalBadgeTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalBadgeTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global badge template steps in order and keeps a trace of each. */
export class GlobalBadgeTemplateEngine {
  steps: GlobalBadgeTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalBadgeTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalBadgeTemplate): number {
    let current = item.projectedValue();
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

  evaluateAll(items: GlobalBadgeTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalBadgeTemplateEngine(): GlobalBadgeTemplateEngine {
  return new GlobalBadgeTemplateEngine(
    [
      new RoundingGlobalBadgeTemplateAdjuster(0.25),
      new TieredGlobalBadgeTemplateAdjuster([1955, 2719, 6249, 8280], [1.11, 1.13, 1.09, 1.1]),
      new GlobalBadgeTemplateSequenceOffsetAdjuster(1.61),
      new CapGlobalBadgeTemplateAdjuster(24860),
    ],
    [],
    1.2,
    65126.6,
  );
}
