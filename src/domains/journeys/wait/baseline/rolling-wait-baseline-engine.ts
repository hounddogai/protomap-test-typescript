import { RollingWaitBaseline } from "./rolling-wait-baseline.js";

/** One step of the rolling wait baseline calculation. */
export interface RollingWaitBaselineAdjuster {
  describe(): string;
  adjust(item: RollingWaitBaseline, value: number): number;
}

export class RollingWaitBaselineCapacityOffsetAdjuster implements RollingWaitBaselineAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: RollingWaitBaseline, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class LocaleRollingWaitBaselineAdjuster implements RollingWaitBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RollingWaitBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRollingWaitBaselineAdjuster implements RollingWaitBaselineAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingWaitBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingWaitBaselineAdjuster implements RollingWaitBaselineAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingWaitBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling wait baseline steps in order and keeps a trace of each. */
export class RollingWaitBaselineEngine {
  steps: RollingWaitBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingWaitBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingWaitBaseline): number {
    let current = item.projectedValue();
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

  evaluateAll(items: RollingWaitBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingWaitBaselineEngine(): RollingWaitBaselineEngine {
  return new RollingWaitBaselineEngine(
    [
      new RollingWaitBaselineCapacityOffsetAdjuster(1.11),
      new LocaleRollingWaitBaselineAdjuster(new Map<string, number>([["online", 0.85], ["west", 0.92]])),
      new PercentRollingWaitBaselineAdjuster(-3.8),
      new MinimumRollingWaitBaselineAdjuster(28.5),
    ],
    [],
    4.2,
    33640.1,
  );
}
