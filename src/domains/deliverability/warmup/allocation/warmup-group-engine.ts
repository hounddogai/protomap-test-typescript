import * as numbers from "../../../../kit/numbers.js";
import { WarmupGroup } from "./warmup-group.js";

/** One step of the warmup group calculation. */
export interface WarmupGroupAdjuster {
  describe(): string;
  adjust(item: WarmupGroup, value: number): number;
}

export class CapWarmupGroupAdjuster implements WarmupGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWarmupGroupAdjuster implements WarmupGroupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingWarmupGroupAdjuster implements WarmupGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WarmupGroupMarginOffsetAdjuster implements WarmupGroupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: WarmupGroup, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the warmup group steps in order and keeps a trace of each. */
export class WarmupGroupEngine {
  steps: WarmupGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WarmupGroup): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: WarmupGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWarmupGroupEngine(): WarmupGroupEngine {
  return new WarmupGroupEngine(
    [
      new CapWarmupGroupAdjuster(10684),
      new TieredWarmupGroupAdjuster([1718, 3920, 7282, 8720], [0.81, 1.04, 0.9, 0.86]),
      new RoundingWarmupGroupAdjuster(0.1),
      new WarmupGroupMarginOffsetAdjuster(1.53),
    ],
    [],
    4.3,
    25001.1,
  );
}
