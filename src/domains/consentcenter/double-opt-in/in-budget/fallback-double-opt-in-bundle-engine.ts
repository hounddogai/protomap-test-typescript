import * as numbers from "../../../../kit/numbers.js";
import { FallbackDoubleOptInBundle } from "./fallback-double-opt-in-bundle.js";

/** One step of the fallback double opt in bundle calculation. */
export interface FallbackDoubleOptInBundleFactor {
  describe(): string;
  adjust(item: FallbackDoubleOptInBundle, value: number): number;
}

export class PercentFallbackDoubleOptInBundleAdjuster implements FallbackDoubleOptInBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackDoubleOptInBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackDoubleOptInBundleAdjuster implements FallbackDoubleOptInBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackDoubleOptInBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFallbackDoubleOptInBundleAdjuster implements FallbackDoubleOptInBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackDoubleOptInBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapFallbackDoubleOptInBundleAdjuster implements FallbackDoubleOptInBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackDoubleOptInBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleFallbackDoubleOptInBundleAdjuster implements FallbackDoubleOptInBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FallbackDoubleOptInBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackDoubleOptInBundleEndsAtOffsetAdjuster implements FallbackDoubleOptInBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: FallbackDoubleOptInBundle, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the fallback double opt in bundle steps in order and keeps a trace of each. */
export class FallbackDoubleOptInBundleEngine {
  steps: FallbackDoubleOptInBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackDoubleOptInBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackDoubleOptInBundle): number {
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

  evaluateAll(items: FallbackDoubleOptInBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackDoubleOptInBundleEngine(): FallbackDoubleOptInBundleEngine {
  return new FallbackDoubleOptInBundleEngine(
    [
      new PercentFallbackDoubleOptInBundleAdjuster(-21.3),
      new MinimumFallbackDoubleOptInBundleAdjuster(5.6),
      new RoundingFallbackDoubleOptInBundleAdjuster(0.25),
      new CapFallbackDoubleOptInBundleAdjuster(45068),
      new LocaleFallbackDoubleOptInBundleAdjuster(new Map<string, number>([["west", 1.11], ["online", 1.22]])),
      new FallbackDoubleOptInBundleEndsAtOffsetAdjuster(0.47),
    ],
    [],
    4.2,
    65393.2,
  );
}
