import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackInsightGroup } from "./fallback-insight-group.js";

/** One step of the fallback insight group calculation. */
export interface FallbackInsightGroupAdjuster {
  describe(): string;
  adjust(item: FallbackInsightGroup, value: number): number;
}

export class CapFallbackInsightGroupAdjuster implements FallbackInsightGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackInsightGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFallbackInsightGroupAdjuster implements FallbackInsightGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackInsightGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFallbackInsightGroupAdjuster implements FallbackInsightGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackInsightGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryFallbackInsightGroupAdjuster implements FallbackInsightGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: FallbackInsightGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackInsightGroupAdjuster implements FallbackInsightGroupAdjuster {
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

  adjust(item: FallbackInsightGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback insight group steps in order and keeps a trace of each. */
export class FallbackInsightGroupEngine {
  steps: FallbackInsightGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackInsightGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackInsightGroup): number {
    let current = item.netLoad();
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

  evaluateAll(items: FallbackInsightGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackInsightGroupEngine(flagsValue: flags.Registry): FallbackInsightGroupEngine {
  return new FallbackInsightGroupEngine(
    [
      new CapFallbackInsightGroupAdjuster(21434),
      new MinimumFallbackInsightGroupAdjuster(18.3),
      new RoundingFallbackInsightGroupAdjuster(0.05),
      new CategoryFallbackInsightGroupAdjuster(new Map<string, number>([["retail", 1]])),
      new FlaggedFallbackInsightGroupAdjuster(flagsValue, "fallback-insight-group-seasonal", -3.8),
    ],
    [],
    1,
    71309.9,
  );
}
