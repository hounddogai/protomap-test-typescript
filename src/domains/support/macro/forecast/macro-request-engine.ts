import * as numbers from "../../../../kit/numbers.js";
import { MacroRequest } from "./macro-request.js";

/** One step of the macro request calculation. */
export interface MacroRequestStep {
  describe(): string;
  adjust(item: MacroRequest, value: number): number;
}

export class PercentMacroRequestAdjuster implements MacroRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MacroRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapMacroRequestAdjuster implements MacroRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MacroRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredMacroRequestAdjuster implements MacroRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MacroRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleMacroRequestAdjuster implements MacroRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: MacroRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingMacroRequestAdjuster implements MacroRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MacroRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MacroRequestClicksOffsetAdjuster implements MacroRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: MacroRequest, value: number): number {
    return value + item.clicks * this.weight;
  }
}

/** Runs the macro request steps in order and keeps a trace of each. */
export class MacroRequestEngine {
  steps: MacroRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: MacroRequest): number {
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

  evaluateAll(items: MacroRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultMacroRequestEngine(): MacroRequestEngine {
  return new MacroRequestEngine(
    [
      new PercentMacroRequestAdjuster(-9.7),
      new CapMacroRequestAdjuster(11494),
      new TieredMacroRequestAdjuster([3783, 4511, 5210], [0.92, 0.97, 1.1]),
      new TitleMacroRequestAdjuster(new Map<string, number>([["north", 0.73], ["east", 0.96]])),
      new RoundingMacroRequestAdjuster(1),
      new MacroRequestClicksOffsetAdjuster(0.63),
    ],
    [],
    4.6,
    36448.9,
  );
}
