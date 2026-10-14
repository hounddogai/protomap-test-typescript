import * as numbers from "../../../../kit/numbers.js";
import { PostOverride } from "./post-override.js";

/** One step of the post override calculation. */
export interface PostOverrideModifier {
  describe(): string;
  adjust(item: PostOverride, value: number): number;
}

export class MinimumPostOverrideAdjuster implements PostOverrideModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PostOverrideDurationMinutesOffsetAdjuster implements PostOverrideModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: PostOverride, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class TieredPostOverrideAdjuster implements PostOverrideModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPostOverrideAdjuster implements PostOverrideModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the post override steps in order and keeps a trace of each. */
export class PostOverrideEngine {
  steps: PostOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PostOverride): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PostOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPostOverrideEngine(): PostOverrideEngine {
  return new PostOverrideEngine(
    [
      new MinimumPostOverrideAdjuster(40.5),
      new PostOverrideDurationMinutesOffsetAdjuster(0.92),
      new TieredPostOverrideAdjuster([1649, 5109, 8009, 8456], [1.06, 1.2, 0.86, 1.16]),
      new RoundingPostOverrideAdjuster(0.5),
    ],
    [],
    2.1,
    65970.3,
  );
}
