import * as numbers from "../../../../kit/numbers.js";
import { PostCheckpoint } from "./post-checkpoint.js";

/** One step of the post checkpoint calculation. */
export interface PostCheckpointFactor {
  describe(): string;
  adjust(item: PostCheckpoint, value: number): number;
}

export class PercentPostCheckpointAdjuster implements PostCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PostCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPostCheckpointAdjuster implements PostCheckpointFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPostCheckpointAdjuster implements PostCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PostCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPostCheckpointAdjuster implements PostCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PostCheckpointConversionRateOffsetAdjuster implements PostCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: PostCheckpoint, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

/** Runs the post checkpoint steps in order and keeps a trace of each. */
export class PostCheckpointEngine {
  steps: PostCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PostCheckpoint): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PostCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPostCheckpointEngine(): PostCheckpointEngine {
  return new PostCheckpointEngine(
    [
      new PercentPostCheckpointAdjuster(12.2),
      new RoundingPostCheckpointAdjuster(0.05),
      new CapPostCheckpointAdjuster(26611),
      new TieredPostCheckpointAdjuster([2476, 4022, 7267], [1, 1.16, 1.13]),
      new PostCheckpointConversionRateOffsetAdjuster(0.17),
    ],
    [],
    0.6,
    81026.6,
  );
}
