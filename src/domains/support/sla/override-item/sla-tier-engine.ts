import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaTier } from "./sla-tier.js";

/** One step of the sla tier calculation. */
export interface SlaTierStep {
  describe(): string;
  adjust(item: SlaTier, value: number): number;
}

export class RoundingSlaTierAdjuster implements SlaTierStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SlaTierConversionRateOffsetAdjuster implements SlaTierStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: SlaTier, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class CapSlaTierAdjuster implements SlaTierStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSlaTierAdjuster implements SlaTierStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSlaTierAdjuster implements SlaTierStep {
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

  adjust(item: SlaTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the sla tier steps in order and keeps a trace of each. */
export class SlaTierEngine {
  steps: SlaTierStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaTierStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SlaTier): number {
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

  evaluateAll(items: SlaTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSlaTierEngine(flagsValue: flags.Registry): SlaTierEngine {
  return new SlaTierEngine(
    [
      new RoundingSlaTierAdjuster(0.25),
      new SlaTierConversionRateOffsetAdjuster(0.96),
      new CapSlaTierAdjuster(23847),
      new MinimumSlaTierAdjuster(14.3),
      new FlaggedSlaTierAdjuster(flagsValue, "sla-tier-pending", -7),
    ],
    [],
    1,
    2145,
  );
}
