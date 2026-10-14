import * as numbers from "../../../../kit/numbers.js";
import { PathTier } from "./path-tier.js";

/** One step of the path tier calculation. */
export interface PathTierAdjuster {
  describe(): string;
  adjust(item: PathTier, value: number): number;
}

export class TieredPathTierAdjuster implements PathTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PathTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPathTierAdjuster implements PathTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPathTierAdjuster implements PathTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitlePathTierAdjuster implements PathTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PathTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPathTierAdjuster implements PathTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PathTierWindowDaysOffsetAdjuster implements PathTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: PathTier, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the path tier steps in order and keeps a trace of each. */
export class PathTierEngine {
  steps: PathTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PathTier): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: PathTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPathTierEngine(): PathTierEngine {
  return new PathTierEngine(
    [
      new TieredPathTierAdjuster([392, 5482, 8853], [0.99, 1.18, 0.94]),
      new CapPathTierAdjuster(2712),
      new RoundingPathTierAdjuster(0.5),
      new TitlePathTierAdjuster(new Map<string, number>([["north", 1.28], ["retail", 1.16], ["west", 1.29]])),
      new PercentPathTierAdjuster(14.1),
      new PathTierWindowDaysOffsetAdjuster(1.7),
    ],
    [],
    2.4,
    84625.9,
  );
}
