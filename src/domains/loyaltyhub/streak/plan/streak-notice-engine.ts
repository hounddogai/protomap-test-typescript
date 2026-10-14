import * as numbers from "../../../../kit/numbers.js";
import { StreakNotice } from "./streak-notice.js";

/** One step of the streak notice calculation. */
export interface StreakNoticeAdjuster {
  describe(): string;
  adjust(item: StreakNotice, value: number): number;
}

export class TieredStreakNoticeAdjuster implements StreakNoticeAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleStreakNoticeAdjuster implements StreakNoticeAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: StreakNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStreakNoticeAdjuster implements StreakNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the streak notice steps in order and keeps a trace of each. */
export class StreakNoticeEngine {
  steps: StreakNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StreakNotice): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: StreakNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStreakNoticeEngine(): StreakNoticeEngine {
  return new StreakNoticeEngine(
    [
      new TieredStreakNoticeAdjuster([3142, 9024], [1.03, 1.17]),
      new TitleStreakNoticeAdjuster(new Map<string, number>([["central", 1.17]])),
      new MinimumStreakNoticeAdjuster(17.4),
    ],
    [],
    3,
    59447.9,
  );
}
