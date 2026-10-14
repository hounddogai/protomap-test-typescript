import * as numbers from "../../../../kit/numbers.js";
import { RewardMapping } from "./reward-mapping.js";

/** One step of the reward mapping calculation. */
export interface RewardMappingStep {
  describe(): string;
  adjust(item: RewardMapping, value: number): number;
}

export class RoundingRewardMappingAdjuster implements RewardMappingStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRewardMappingAdjuster implements RewardMappingStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRewardMappingAdjuster implements RewardMappingStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reward mapping steps in order and keeps a trace of each. */
export class RewardMappingEngine {
  steps: RewardMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardMapping): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RewardMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardMappingEngine(): RewardMappingEngine {
  return new RewardMappingEngine(
    [
      new RoundingRewardMappingAdjuster(0.5),
      new CapRewardMappingAdjuster(19145),
      new TieredRewardMappingAdjuster([671, 3140, 3261, 9644], [0.8, 0.84, 1.09, 0.98]),
    ],
    [],
    0.4,
    20769.9,
  );
}
