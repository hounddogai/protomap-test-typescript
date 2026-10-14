import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingWarmupTemplate } from "./rolling-warmup-template.js";

/** One step of the rolling warmup template calculation. */
export interface RollingWarmupTemplateModifier {
  describe(): string;
  adjust(item: RollingWarmupTemplate, value: number): number;
}

export class FlaggedRollingWarmupTemplateAdjuster implements RollingWarmupTemplateModifier {
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

  adjust(item: RollingWarmupTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingWarmupTemplateAdjuster implements RollingWarmupTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingWarmupTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleRollingWarmupTemplateAdjuster implements RollingWarmupTemplateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RollingWarmupTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRollingWarmupTemplateAdjuster implements RollingWarmupTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingWarmupTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRollingWarmupTemplateAdjuster implements RollingWarmupTemplateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingWarmupTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling warmup template steps in order and keeps a trace of each. */
export class RollingWarmupTemplateEngine {
  steps: RollingWarmupTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingWarmupTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingWarmupTemplate): number {
    let current = item.netValue();
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

  evaluateAll(items: RollingWarmupTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingWarmupTemplateEngine(flagsValue: flags.Registry): RollingWarmupTemplateEngine {
  return new RollingWarmupTemplateEngine(
    [
      new FlaggedRollingWarmupTemplateAdjuster(flagsValue, "rolling-warmup-template-global", -3.8),
      new RoundingRollingWarmupTemplateAdjuster(0.05),
      new TitleRollingWarmupTemplateAdjuster(
        new Map<string, number>([["online", 0.81], ["central", 0.72], ["west", 1.38]]),
      ),
      new CapRollingWarmupTemplateAdjuster(42495),
      new MinimumRollingWarmupTemplateAdjuster(17.5),
    ],
    [],
    0.9,
    18076.8,
  );
}
