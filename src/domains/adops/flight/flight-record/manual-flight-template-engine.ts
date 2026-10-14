import * as numbers from "../../../../kit/numbers.js";
import { ManualFlightTemplate } from "./manual-flight-template.js";

/** One step of the manual flight template calculation. */
export interface ManualFlightTemplateModifier {
  describe(): string;
  adjust(item: ManualFlightTemplate, value: number): number;
}

export class TieredManualFlightTemplateAdjuster implements ManualFlightTemplateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualFlightTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapManualFlightTemplateAdjuster implements ManualFlightTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualFlightTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingManualFlightTemplateAdjuster implements ManualFlightTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualFlightTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ManualFlightTemplateBudgetOffsetAdjuster implements ManualFlightTemplateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ManualFlightTemplate, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the manual flight template steps in order and keeps a trace of each. */
export class ManualFlightTemplateEngine {
  steps: ManualFlightTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualFlightTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualFlightTemplate): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ManualFlightTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualFlightTemplateEngine(): ManualFlightTemplateEngine {
  return new ManualFlightTemplateEngine(
    [
      new TieredManualFlightTemplateAdjuster([9688, 9856], [1.08, 0.94]),
      new CapManualFlightTemplateAdjuster(23011),
      new RoundingManualFlightTemplateAdjuster(0.05),
      new ManualFlightTemplateBudgetOffsetAdjuster(1.37),
    ],
    [],
    3.5,
    23024.4,
  );
}
