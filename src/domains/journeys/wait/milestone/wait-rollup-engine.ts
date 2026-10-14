import * as numbers from "../../../../kit/numbers.js";
import { WaitRollup } from "./wait-rollup.js";

/** One step of the wait rollup calculation. */
export interface WaitRollupFactor {
  describe(): string;
  adjust(item: WaitRollup, value: number): number;
}

export class WaitRollupCeilingOffsetAdjuster implements WaitRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: WaitRollup, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class TitleWaitRollupAdjuster implements WaitRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WaitRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWaitRollupAdjuster implements WaitRollupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWaitRollupAdjuster implements WaitRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWaitRollupAdjuster implements WaitRollupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the wait rollup steps in order and keeps a trace of each. */
export class WaitRollupEngine {
  steps: WaitRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WaitRollup): number {
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

  evaluateAll(items: WaitRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWaitRollupEngine(): WaitRollupEngine {
  return new WaitRollupEngine(
    [
      new WaitRollupCeilingOffsetAdjuster(0.84),
      new TitleWaitRollupAdjuster(new Map<string, number>([["online", 1.16]])),
      new RoundingWaitRollupAdjuster(5),
      new PercentWaitRollupAdjuster(-24.7),
      new CapWaitRollupAdjuster(23854),
    ],
    [],
    0.7,
    91432.8,
  );
}
