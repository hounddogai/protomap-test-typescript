import * as numbers from "../../../../kit/numbers.js";
import { CreativeTemplate } from "./creative-template.js";

/** One step of the creative template calculation. */
export interface CreativeTemplateModifier {
  describe(): string;
  adjust(item: CreativeTemplate, value: number): number;
}

export class RoundingCreativeTemplateAdjuster implements CreativeTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCreativeTemplateAdjuster implements CreativeTemplateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreativeTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapCreativeTemplateAdjuster implements CreativeTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreativeTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameCreativeTemplateAdjuster implements CreativeTemplateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CreativeTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCreativeTemplateAdjuster implements CreativeTemplateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCreativeTemplateAdjuster implements CreativeTemplateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the creative template steps in order and keeps a trace of each. */
export class CreativeTemplateEngine {
  steps: CreativeTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreativeTemplate): number {
    let current = item.netExposure();
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

  evaluateAll(items: CreativeTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreativeTemplateEngine(): CreativeTemplateEngine {
  return new CreativeTemplateEngine(
    [
      new RoundingCreativeTemplateAdjuster(0.5),
      new MinimumCreativeTemplateAdjuster(25),
      new CapCreativeTemplateAdjuster(35472),
      new NameCreativeTemplateAdjuster(
        new Map<string, number>([["south", 0.74], ["central", 0.93], ["online", 1.19]]),
      ),
      new TieredCreativeTemplateAdjuster([3985, 7885], [1.14, 0.97]),
      new PercentCreativeTemplateAdjuster(18),
    ],
    [],
    3.4,
    94478.1,
  );
}
