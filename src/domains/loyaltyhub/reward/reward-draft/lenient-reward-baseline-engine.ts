import * as numbers from "../../../../kit/numbers.js";
import { LenientRewardBaseline } from "./lenient-reward-baseline.js";

/** One step of the lenient reward baseline calculation. */
export interface LenientRewardBaselineFactor {
  describe(): string;
  adjust(item: LenientRewardBaseline, value: number): number;
}

export class CapLenientRewardBaselineAdjuster implements LenientRewardBaselineFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientRewardBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLenientRewardBaselineAdjuster implements LenientRewardBaselineFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientRewardBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LenientRewardBaselineCreatedAtOffsetAdjuster implements LenientRewardBaselineFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: LenientRewardBaseline, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the lenient reward baseline steps in order and keeps a trace of each. */
export class LenientRewardBaselineEngine {
  steps: LenientRewardBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientRewardBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientRewardBaseline): number {
    let current = item.netValue();
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

  evaluateAll(items: LenientRewardBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientRewardBaselineEngine(): LenientRewardBaselineEngine {
  return new LenientRewardBaselineEngine(
    [
      new CapLenientRewardBaselineAdjuster(44712),
      new RoundingLenientRewardBaselineAdjuster(0.05),
      new LenientRewardBaselineCreatedAtOffsetAdjuster(0.95),
    ],
    [],
    2.4,
    42513.7,
  );
}
