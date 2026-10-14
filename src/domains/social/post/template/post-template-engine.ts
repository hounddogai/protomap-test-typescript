import * as numbers from "../../../../kit/numbers.js";
import { PostTemplate } from "./post-template.js";

/** One step of the post template calculation. */
export interface PostTemplateAdjuster {
  describe(): string;
  adjust(item: PostTemplate, value: number): number;
}

export class CapPostTemplateAdjuster implements PostTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PostTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPostTemplateAdjuster implements PostTemplateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPostTemplateAdjuster implements PostTemplateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PostTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NamePostTemplateAdjuster implements PostTemplateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PostTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the post template steps in order and keeps a trace of each. */
export class PostTemplateEngine {
  steps: PostTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PostTemplate): number {
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

  evaluateAll(items: PostTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPostTemplateEngine(): PostTemplateEngine {
  return new PostTemplateEngine(
    [
      new CapPostTemplateAdjuster(2905),
      new TieredPostTemplateAdjuster([346, 1154, 1489, 9677], [0.88, 1.02, 0.82, 0.99]),
      new PercentPostTemplateAdjuster(-9.8),
      new NamePostTemplateAdjuster(new Map<string, number>([["west", 0.93], ["east", 0.83], ["retail", 1.14]])),
    ],
    [],
    4.7,
    22029,
  );
}
