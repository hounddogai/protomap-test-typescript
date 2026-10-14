import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BadgeTier } from "./badge-tier.js";

/** One step of the badge tier calculation. */
export interface BadgeTierModifier {
  describe(): string;
  adjust(item: BadgeTier, value: number): number;
}

export class LocaleBadgeTierAdjuster implements BadgeTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: BadgeTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedBadgeTierAdjuster implements BadgeTierModifier {
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

  adjust(item: BadgeTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBadgeTierAdjuster implements BadgeTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBadgeTierAdjuster implements BadgeTierModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class BadgeTierRateOffsetAdjuster implements BadgeTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: BadgeTier, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class PercentBadgeTierAdjuster implements BadgeTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the badge tier steps in order and keeps a trace of each. */
export class BadgeTierEngine {
  steps: BadgeTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BadgeTier): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: BadgeTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBadgeTierEngine(flagsValue: flags.Registry): BadgeTierEngine {
  return new BadgeTierEngine(
    [
      new LocaleBadgeTierAdjuster(new Map<string, number>([["online", 0.86], ["east", 1.31], ["west", 0.99]])),
      new FlaggedBadgeTierAdjuster(flagsValue, "badge-tier-tiered", 8.8),
      new RoundingBadgeTierAdjuster(0.25),
      new CapBadgeTierAdjuster(36246),
      new BadgeTierRateOffsetAdjuster(0.98),
      new PercentBadgeTierAdjuster(-2.3),
    ],
    [],
    3.7,
    85781.2,
  );
}
