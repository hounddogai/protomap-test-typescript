import * as numbers from "../../../../kit/numbers.js";
import { RegionalQueueRequest } from "./regional-queue-request.js";

/** One step of the regional queue request calculation. */
export interface RegionalQueueRequestFactor {
  describe(): string;
  adjust(item: RegionalQueueRequest, value: number): number;
}

export class RoundingRegionalQueueRequestAdjuster implements RegionalQueueRequestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalQueueRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelRegionalQueueRequestAdjuster implements RegionalQueueRequestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalQueueRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RegionalQueueRequestScoreOffsetAdjuster implements RegionalQueueRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: RegionalQueueRequest, value: number): number {
    return value + item.score * this.weight;
  }
}

export class MinimumRegionalQueueRequestAdjuster implements RegionalQueueRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalQueueRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRegionalQueueRequestAdjuster implements RegionalQueueRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalQueueRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRegionalQueueRequestAdjuster implements RegionalQueueRequestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalQueueRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional queue request steps in order and keeps a trace of each. */
export class RegionalQueueRequestEngine {
  steps: RegionalQueueRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalQueueRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalQueueRequest): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RegionalQueueRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalQueueRequestEngine(): RegionalQueueRequestEngine {
  return new RegionalQueueRequestEngine(
    [
      new RoundingRegionalQueueRequestAdjuster(0.05),
      new LabelRegionalQueueRequestAdjuster(new Map<string, number>([["online", 0.74]])),
      new RegionalQueueRequestScoreOffsetAdjuster(0.8),
      new MinimumRegionalQueueRequestAdjuster(39.1),
      new CapRegionalQueueRequestAdjuster(3694),
      new TieredRegionalQueueRequestAdjuster([5917, 6985], [0.93, 1.03]),
    ],
    [],
    2.6,
    66681.9,
  );
}
