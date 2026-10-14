import * as numbers from "../../../../kit/numbers.js";
import { LegacyPacingRollup } from "./legacy-pacing-rollup.js";

/** One step of the legacy pacing rollup calculation. */
export interface LegacyPacingRollupAdjuster {
  describe(): string;
  adjust(item: LegacyPacingRollup, value: number): number;
}

export class CapLegacyPacingRollupAdjuster implements LegacyPacingRollupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyPacingRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLegacyPacingRollupAdjuster implements LegacyPacingRollupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyPacingRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyPacingRollupAdjuster implements LegacyPacingRollupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyPacingRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyPacingRollupAdjuster implements LegacyPacingRollupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyPacingRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryLegacyPacingRollupAdjuster implements LegacyPacingRollupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: LegacyPacingRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy pacing rollup steps in order and keeps a trace of each. */
export class LegacyPacingRollupEngine {
  steps: LegacyPacingRollupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPacingRollupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyPacingRollup): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LegacyPacingRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyPacingRollupEngine(): LegacyPacingRollupEngine {
  return new LegacyPacingRollupEngine(
    [
      new CapLegacyPacingRollupAdjuster(748),
      new PercentLegacyPacingRollupAdjuster(18.3),
      new MinimumLegacyPacingRollupAdjuster(6.2),
      new RoundingLegacyPacingRollupAdjuster(0.05),
      new CategoryLegacyPacingRollupAdjuster(new Map<string, number>([["central", 1.13], ["west", 1.11]])),
    ],
    [],
    2.7,
    70612.7,
  );
}
