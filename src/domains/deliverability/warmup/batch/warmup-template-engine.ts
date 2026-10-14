import * as numbers from "../../../../kit/numbers.js";
import { WarmupTemplate } from "./warmup-template.js";

/** One step of the warmup template calculation. */
export interface WarmupTemplateModifier {
  describe(): string;
  adjust(item: WarmupTemplate, value: number): number;
}

export class CapWarmupTemplateAdjuster implements WarmupTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWarmupTemplateAdjuster implements WarmupTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameWarmupTemplateAdjuster implements WarmupTemplateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WarmupTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the warmup template steps in order and keeps a trace of each. */
export class WarmupTemplateEngine {
  steps: WarmupTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WarmupTemplate): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: WarmupTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWarmupTemplateEngine(): WarmupTemplateEngine {
  return new WarmupTemplateEngine(
    [
      new CapWarmupTemplateAdjuster(12159),
      new RoundingWarmupTemplateAdjuster(0.05),
      new NameWarmupTemplateAdjuster(new Map<string, number>([["west", 0.91]])),
    ],
    [],
    0.5,
    51540,
  );
}
