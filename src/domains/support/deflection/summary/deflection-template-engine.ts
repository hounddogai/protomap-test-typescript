import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionTemplate } from "./deflection-template.js";

/** One step of the deflection template calculation. */
export interface DeflectionTemplateAdjuster {
  describe(): string;
  adjust(item: DeflectionTemplate, value: number): number;
}

export class FlaggedDeflectionTemplateAdjuster implements DeflectionTemplateAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: DeflectionTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class DeflectionTemplateScoreOffsetAdjuster implements DeflectionTemplateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: DeflectionTemplate, value: number): number {
    return value + item.score * this.weight;
  }
}

export class CapDeflectionTemplateAdjuster implements DeflectionTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleDeflectionTemplateAdjuster implements DeflectionTemplateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: DeflectionTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingDeflectionTemplateAdjuster implements DeflectionTemplateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the deflection template steps in order and keeps a trace of each. */
export class DeflectionTemplateEngine {
  steps: DeflectionTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionTemplate): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: DeflectionTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionTemplateEngine(flagsValue: flags.Registry): DeflectionTemplateEngine {
  return new DeflectionTemplateEngine(
    [
      new FlaggedDeflectionTemplateAdjuster(flagsValue, "deflection-template-capped", 4.6),
      new DeflectionTemplateScoreOffsetAdjuster(0.42),
      new CapDeflectionTemplateAdjuster(10747),
      new LocaleDeflectionTemplateAdjuster(new Map<string, number>([["north", 0.82]])),
      new RoundingDeflectionTemplateAdjuster(0.05),
    ],
    [],
    2.2,
    73715,
  );
}
