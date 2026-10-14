import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictStreakTemplate } from "./strict-streak-template.js";

/** One step of the strict streak template calculation. */
export interface StrictStreakTemplateAdjuster {
  describe(): string;
  adjust(item: StrictStreakTemplate, value: number): number;
}

export class UtmSourceStrictStreakTemplateAdjuster implements StrictStreakTemplateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: StrictStreakTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedStrictStreakTemplateAdjuster implements StrictStreakTemplateAdjuster {
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

  adjust(item: StrictStreakTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class StrictStreakTemplateMinimumOffsetAdjuster implements StrictStreakTemplateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: StrictStreakTemplate, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class PercentStrictStreakTemplateAdjuster implements StrictStreakTemplateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictStreakTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictStreakTemplateAdjuster implements StrictStreakTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictStreakTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the strict streak template steps in order and keeps a trace of each. */
export class StrictStreakTemplateEngine {
  steps: StrictStreakTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictStreakTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictStreakTemplate): number {
    let current = item.netTotal();
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

  evaluateAll(items: StrictStreakTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictStreakTemplateEngine(flagsValue: flags.Registry): StrictStreakTemplateEngine {
  return new StrictStreakTemplateEngine(
    [
      new UtmSourceStrictStreakTemplateAdjuster(
        new Map<string, number>([["retail", 1.23], ["west", 0.84], ["south", 0.85]]),
      ),
      new FlaggedStrictStreakTemplateAdjuster(flagsValue, "strict-streak-template-weighted", -4.3),
      new StrictStreakTemplateMinimumOffsetAdjuster(0.14),
      new PercentStrictStreakTemplateAdjuster(-13.6),
      new CapStrictStreakTemplateAdjuster(47501),
    ],
    [],
    0.5,
    76346.3,
  );
}
