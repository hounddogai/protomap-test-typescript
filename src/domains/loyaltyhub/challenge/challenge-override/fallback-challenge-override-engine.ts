import * as numbers from "../../../../kit/numbers.js";
import { FallbackChallengeOverride } from "./fallback-challenge-override.js";

/** One step of the fallback challenge override calculation. */
export interface FallbackChallengeOverrideFactor {
  describe(): string;
  adjust(item: FallbackChallengeOverride, value: number): number;
}

export class PercentFallbackChallengeOverrideAdjuster implements FallbackChallengeOverrideFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackChallengeOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackChallengeOverrideAdjuster implements FallbackChallengeOverrideFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackChallengeOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumFallbackChallengeOverrideAdjuster implements FallbackChallengeOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackChallengeOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback challenge override steps in order and keeps a trace of each. */
export class FallbackChallengeOverrideEngine {
  steps: FallbackChallengeOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackChallengeOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackChallengeOverride): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FallbackChallengeOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackChallengeOverrideEngine(): FallbackChallengeOverrideEngine {
  return new FallbackChallengeOverrideEngine(
    [
      new PercentFallbackChallengeOverrideAdjuster(8.8),
      new RoundingFallbackChallengeOverrideAdjuster(5),
      new MinimumFallbackChallengeOverrideAdjuster(13.3),
    ],
    [],
    0.5,
    81239.9,
  );
}
