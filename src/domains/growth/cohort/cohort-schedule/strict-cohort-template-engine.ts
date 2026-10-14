import * as numbers from "../../../../kit/numbers.js";
import { StrictCohortTemplate } from "./strict-cohort-template.js";

/** One step of the strict cohort template calculation. */
export interface StrictCohortTemplateFactor {
  describe(): string;
  adjust(item: StrictCohortTemplate, value: number): number;
}

export class CapStrictCohortTemplateAdjuster implements StrictCohortTemplateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictCohortTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentStrictCohortTemplateAdjuster implements StrictCohortTemplateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictCohortTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictCohortTemplateAdjuster implements StrictCohortTemplateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictCohortTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingStrictCohortTemplateAdjuster implements StrictCohortTemplateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictCohortTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the strict cohort template steps in order and keeps a trace of each. */
export class StrictCohortTemplateEngine {
  steps: StrictCohortTemplateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictCohortTemplateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictCohortTemplate): number {
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

  evaluateAll(items: StrictCohortTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictCohortTemplateEngine(): StrictCohortTemplateEngine {
  return new StrictCohortTemplateEngine(
    [
      new CapStrictCohortTemplateAdjuster(13646),
      new PercentStrictCohortTemplateAdjuster(-24.7),
      new MinimumStrictCohortTemplateAdjuster(40.3),
      new RoundingStrictCohortTemplateAdjuster(0.1),
    ],
    [],
    4,
    7163,
  );
}
