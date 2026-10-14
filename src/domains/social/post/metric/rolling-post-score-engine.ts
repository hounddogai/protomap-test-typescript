import * as numbers from "../../../../kit/numbers.js";
import { RollingPostScore } from "./rolling-post-score.js";

/** One step of the rolling post score calculation. */
export interface RollingPostScoreAdjuster {
  describe(): string;
  adjust(item: RollingPostScore, value: number): number;
}

export class PercentRollingPostScoreAdjuster implements RollingPostScoreAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingPostScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingPostScoreAdjuster implements RollingPostScoreAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingPostScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RollingPostScoreThresholdOffsetAdjuster implements RollingPostScoreAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: RollingPostScore, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class MinimumRollingPostScoreAdjuster implements RollingPostScoreAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingPostScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleRollingPostScoreAdjuster implements RollingPostScoreAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RollingPostScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling post score steps in order and keeps a trace of each. */
export class RollingPostScoreEngine {
  steps: RollingPostScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPostScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingPostScore): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RollingPostScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingPostScoreEngine(): RollingPostScoreEngine {
  return new RollingPostScoreEngine(
    [
      new PercentRollingPostScoreAdjuster(19.9),
      new RoundingRollingPostScoreAdjuster(0.25),
      new RollingPostScoreThresholdOffsetAdjuster(1.07),
      new MinimumRollingPostScoreAdjuster(47.9),
      new TitleRollingPostScoreAdjuster(new Map<string, number>([["north", 0.9], ["online", 0.76]])),
    ],
    [],
    1.6,
    10653.1,
  );
}
