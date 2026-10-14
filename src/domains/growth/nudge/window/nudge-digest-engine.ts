import * as numbers from "../../../../kit/numbers.js";
import { NudgeDigest } from "./nudge-digest.js";

/** One step of the nudge digest calculation. */
export interface NudgeDigestAdjuster {
  describe(): string;
  adjust(item: NudgeDigest, value: number): number;
}

export class TieredNudgeDigestAdjuster implements NudgeDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentNudgeDigestAdjuster implements NudgeDigestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: NudgeDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NudgeDigestAmountOffsetAdjuster implements NudgeDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: NudgeDigest, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class RoundingNudgeDigestAdjuster implements NudgeDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgeDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumNudgeDigestAdjuster implements NudgeDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: NudgeDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the nudge digest steps in order and keeps a trace of each. */
export class NudgeDigestEngine {
  steps: NudgeDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: NudgeDigest): number {
    let current = item.netExposure();
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

  evaluateAll(items: NudgeDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultNudgeDigestEngine(): NudgeDigestEngine {
  return new NudgeDigestEngine(
    [
      new TieredNudgeDigestAdjuster([863, 4745, 6739, 7473], [0.86, 1.19, 0.88, 1.06]),
      new PercentNudgeDigestAdjuster(17.7),
      new NudgeDigestAmountOffsetAdjuster(1.89),
      new RoundingNudgeDigestAdjuster(0.25),
      new MinimumNudgeDigestAdjuster(28.5),
    ],
    [],
    3.5,
    97997.9,
  );
}
