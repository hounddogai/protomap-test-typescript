import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredPostWindow } from "./tiered-post-window.js";

/** One step of the tiered post window calculation. */
export interface TieredPostWindowStep {
  describe(): string;
  adjust(item: TieredPostWindow, value: number): number;
}

export class CapTieredPostWindowAdjuster implements TieredPostWindowStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredPostWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredPostWindowAdjuster implements TieredPostWindowStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredPostWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTieredPostWindowAdjuster implements TieredPostWindowStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredPostWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryTieredPostWindowAdjuster implements TieredPostWindowStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: TieredPostWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTieredPostWindowAdjuster implements TieredPostWindowStep {
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

  adjust(item: TieredPostWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPostWindowCreatedAtOffsetAdjuster implements TieredPostWindowStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: TieredPostWindow, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the tiered post window steps in order and keeps a trace of each. */
export class TieredPostWindowEngine {
  steps: TieredPostWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredPostWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredPostWindow): number {
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

  evaluateAll(items: TieredPostWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredPostWindowEngine(flagsValue: flags.Registry): TieredPostWindowEngine {
  return new TieredPostWindowEngine(
    [
      new CapTieredPostWindowAdjuster(19200),
      new MinimumTieredPostWindowAdjuster(50),
      new RoundingTieredPostWindowAdjuster(5),
      new CategoryTieredPostWindowAdjuster(new Map<string, number>([["east", 1.23], ["west", 1.36]])),
      new FlaggedTieredPostWindowAdjuster(flagsValue, "tiered-post-window-strict", 2.6),
      new TieredPostWindowCreatedAtOffsetAdjuster(1.59),
    ],
    [],
    2.5,
    6041.6,
  );
}
