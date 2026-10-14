import * as numbers from "../../../../kit/numbers.js";
import { GlobalBadgeBaseline } from "./global-badge-baseline.js";

/** One step of the global badge baseline calculation. */
export interface GlobalBadgeBaselineAdjuster {
  describe(): string;
  adjust(item: GlobalBadgeBaseline, value: number): number;
}

export class MinimumGlobalBadgeBaselineAdjuster implements GlobalBadgeBaselineAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalBadgeBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingGlobalBadgeBaselineAdjuster implements GlobalBadgeBaselineAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalBadgeBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredGlobalBadgeBaselineAdjuster implements GlobalBadgeBaselineAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalBadgeBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentGlobalBadgeBaselineAdjuster implements GlobalBadgeBaselineAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalBadgeBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global badge baseline steps in order and keeps a trace of each. */
export class GlobalBadgeBaselineEngine {
  steps: GlobalBadgeBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalBadgeBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalBadgeBaseline): number {
    let current = item.netLoad();
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

  evaluateAll(items: GlobalBadgeBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalBadgeBaselineEngine(): GlobalBadgeBaselineEngine {
  return new GlobalBadgeBaselineEngine(
    [
      new MinimumGlobalBadgeBaselineAdjuster(18.3),
      new RoundingGlobalBadgeBaselineAdjuster(0.05),
      new TieredGlobalBadgeBaselineAdjuster([286, 2444, 2702], [1.02, 0.83, 1.14]),
      new PercentGlobalBadgeBaselineAdjuster(-12.5),
    ],
    [],
    3.4,
    41729.9,
  );
}
