import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BadgeTemplate } from "./badge-template.js";

/** One step of the badge template calculation. */
export interface BadgeTemplateAdjuster {
  describe(): string;
  adjust(item: BadgeTemplate, value: number): number;
}

export class MinimumBadgeTemplateAdjuster implements BadgeTemplateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBadgeTemplateAdjuster implements BadgeTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedBadgeTemplateAdjuster implements BadgeTemplateAdjuster {
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

  adjust(item: BadgeTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBadgeTemplateAdjuster implements BadgeTemplateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceBadgeTemplateAdjuster implements BadgeTemplateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: BadgeTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingBadgeTemplateAdjuster implements BadgeTemplateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the badge template steps in order and keeps a trace of each. */
export class BadgeTemplateEngine {
  steps: BadgeTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BadgeTemplate): number {
    let current = item.netExposure();
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

  evaluateAll(items: BadgeTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBadgeTemplateEngine(flagsValue: flags.Registry): BadgeTemplateEngine {
  return new BadgeTemplateEngine(
    [
      new MinimumBadgeTemplateAdjuster(28.6),
      new CapBadgeTemplateAdjuster(25418),
      new FlaggedBadgeTemplateAdjuster(flagsValue, "badge-template-strict", -7),
      new PercentBadgeTemplateAdjuster(17.6),
      new UtmSourceBadgeTemplateAdjuster(new Map<string, number>([["east", 0.7]])),
      new RoundingBadgeTemplateAdjuster(0.5),
    ],
    [],
    3.2,
    81829.1,
  );
}
