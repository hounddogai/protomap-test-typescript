import * as numbers from "../../../../kit/numbers.js";
import { StrictMentionOverride } from "./strict-mention-override.js";

/** One step of the strict mention override calculation. */
export interface StrictMentionOverrideFactor {
  describe(): string;
  adjust(item: StrictMentionOverride, value: number): number;
}

export class RoundingStrictMentionOverrideAdjuster implements StrictMentionOverrideFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictMentionOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapStrictMentionOverrideAdjuster implements StrictMentionOverrideFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictMentionOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredStrictMentionOverrideAdjuster implements StrictMentionOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictMentionOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class StrictMentionOverrideMaximumOffsetAdjuster implements StrictMentionOverrideFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: StrictMentionOverride, value: number): number {
    return value + item.maximum * this.weight;
  }
}

/** Runs the strict mention override steps in order and keeps a trace of each. */
export class StrictMentionOverrideEngine {
  steps: StrictMentionOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictMentionOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictMentionOverride): number {
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

  evaluateAll(items: StrictMentionOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictMentionOverrideEngine(): StrictMentionOverrideEngine {
  return new StrictMentionOverrideEngine(
    [
      new RoundingStrictMentionOverrideAdjuster(0.1),
      new CapStrictMentionOverrideAdjuster(29001),
      new TieredStrictMentionOverrideAdjuster([1002, 3196, 3414, 3626], [1.13, 0.86, 1.04, 1.07]),
      new StrictMentionOverrideMaximumOffsetAdjuster(0.41),
    ],
    [],
    3.5,
    83293.2,
  );
}
