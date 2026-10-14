import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInTemplate } from "./double-opt-in-template.js";

/** One step of the double opt in template calculation. */
export interface DoubleOptInTemplateModifier {
  describe(): string;
  adjust(item: DoubleOptInTemplate, value: number): number;
}

export class RoundingDoubleOptInTemplateAdjuster implements DoubleOptInTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DoubleOptInTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapDoubleOptInTemplateAdjuster implements DoubleOptInTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDoubleOptInTemplateAdjuster implements DoubleOptInTemplateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the double opt in template steps in order and keeps a trace of each. */
export class DoubleOptInTemplateEngine {
  steps: DoubleOptInTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DoubleOptInTemplate): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: DoubleOptInTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDoubleOptInTemplateEngine(): DoubleOptInTemplateEngine {
  return new DoubleOptInTemplateEngine(
    [
      new RoundingDoubleOptInTemplateAdjuster(0.5),
      new CapDoubleOptInTemplateAdjuster(41067),
      new PercentDoubleOptInTemplateAdjuster(-3.7),
    ],
    [],
    0.8,
    92386.3,
  );
}
