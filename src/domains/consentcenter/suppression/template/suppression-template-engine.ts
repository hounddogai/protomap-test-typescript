import * as numbers from "../../../../kit/numbers.js";
import { SuppressionTemplate } from "./suppression-template.js";

/** One step of the suppression template calculation. */
export interface SuppressionTemplateModifier {
  describe(): string;
  adjust(item: SuppressionTemplate, value: number): number;
}

export class MinimumSuppressionTemplateAdjuster implements SuppressionTemplateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SuppressionTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredSuppressionTemplateAdjuster implements SuppressionTemplateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SuppressionTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSuppressionTemplateAdjuster implements SuppressionTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SuppressionTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSuppressionTemplateAdjuster implements SuppressionTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SuppressionTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelSuppressionTemplateAdjuster implements SuppressionTemplateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: SuppressionTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentSuppressionTemplateAdjuster implements SuppressionTemplateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SuppressionTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the suppression template steps in order and keeps a trace of each. */
export class SuppressionTemplateEngine {
  steps: SuppressionTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SuppressionTemplate): number {
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

  evaluateAll(items: SuppressionTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSuppressionTemplateEngine(): SuppressionTemplateEngine {
  return new SuppressionTemplateEngine(
    [
      new MinimumSuppressionTemplateAdjuster(21.2),
      new TieredSuppressionTemplateAdjuster([3784, 5912, 6071], [1.08, 0.9, 0.84]),
      new CapSuppressionTemplateAdjuster(9174),
      new RoundingSuppressionTemplateAdjuster(0.1),
      new ChannelSuppressionTemplateAdjuster(new Map<string, number>([["retail", 0.8], ["north", 1.23]])),
      new PercentSuppressionTemplateAdjuster(-2.1),
    ],
    [],
    1.5,
    91674.4,
  );
}
