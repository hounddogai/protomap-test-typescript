import * as numbers from "../../../../kit/numbers.js";
import { PostTier } from "./post-tier.js";

/** One step of the post tier calculation. */
export interface PostTierModifier {
  describe(): string;
  adjust(item: PostTier, value: number): number;
}

export class NamePostTierAdjuster implements PostTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PostTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PostTierExpiresAtOffsetAdjuster implements PostTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: PostTier, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class RoundingPostTierAdjuster implements PostTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPostTierAdjuster implements PostTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the post tier steps in order and keeps a trace of each. */
export class PostTierEngine {
  steps: PostTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PostTier): number {
    let current = item.netVolume();
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

  evaluateAll(items: PostTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPostTierEngine(): PostTierEngine {
  return new PostTierEngine(
    [
      new NamePostTierAdjuster(new Map<string, number>([["online", 1.21], ["south", 0.92]])),
      new PostTierExpiresAtOffsetAdjuster(0.5),
      new RoundingPostTierAdjuster(0.1),
      new TieredPostTierAdjuster([3936, 4399], [1.14, 1.15]),
    ],
    [],
    3.6,
    97627.7,
  );
}
