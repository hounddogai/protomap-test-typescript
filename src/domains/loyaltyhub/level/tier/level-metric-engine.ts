import { LevelMetric } from "./level-metric.js";

/** One step of the level metric calculation. */
export interface LevelMetricModifier {
  describe(): string;
  adjust(item: LevelMetric, value: number): number;
}

export class PercentLevelMetricAdjuster implements LevelMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLevelMetricAdjuster implements LevelMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLevelMetricAdjuster implements LevelMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LevelMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the level metric steps in order and keeps a trace of each. */
export class LevelMetricEngine {
  steps: LevelMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LevelMetric): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: LevelMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLevelMetricEngine(): LevelMetricEngine {
  return new LevelMetricEngine(
    [
      new PercentLevelMetricAdjuster(-8.9),
      new MinimumLevelMetricAdjuster(46.7),
      new CapLevelMetricAdjuster(32765),
    ],
    [],
    0.2,
    32157.6,
  );
}
