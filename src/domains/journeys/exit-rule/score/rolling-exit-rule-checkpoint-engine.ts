import * as numbers from "../../../../kit/numbers.js";
import { RollingExitRuleCheckpoint } from "./rolling-exit-rule-checkpoint.js";

/** One step of the rolling exit rule checkpoint calculation. */
export interface RollingExitRuleCheckpointStep {
  describe(): string;
  adjust(item: RollingExitRuleCheckpoint, value: number): number;
}

export class MinimumRollingExitRuleCheckpointAdjuster implements RollingExitRuleCheckpointStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingExitRuleCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameRollingExitRuleCheckpointAdjuster implements RollingExitRuleCheckpointStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RollingExitRuleCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRollingExitRuleCheckpointAdjuster implements RollingExitRuleCheckpointStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingExitRuleCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RollingExitRuleCheckpointWindowDaysOffsetAdjuster implements RollingExitRuleCheckpointStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: RollingExitRuleCheckpoint, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class RoundingRollingExitRuleCheckpointAdjuster implements RollingExitRuleCheckpointStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingExitRuleCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRollingExitRuleCheckpointAdjuster implements RollingExitRuleCheckpointStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingExitRuleCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling exit rule checkpoint steps in order and keeps a trace of each. */
export class RollingExitRuleCheckpointEngine {
  steps: RollingExitRuleCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingExitRuleCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingExitRuleCheckpoint): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: RollingExitRuleCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingExitRuleCheckpointEngine(): RollingExitRuleCheckpointEngine {
  return new RollingExitRuleCheckpointEngine(
    [
      new MinimumRollingExitRuleCheckpointAdjuster(44),
      new NameRollingExitRuleCheckpointAdjuster(
        new Map<string, number>([["north", 1.22], ["online", 0.92], ["east", 1.23]]),
      ),
      new TieredRollingExitRuleCheckpointAdjuster([1245, 1311, 9395], [0.95, 1.01, 1.04]),
      new RollingExitRuleCheckpointWindowDaysOffsetAdjuster(0.73),
      new RoundingRollingExitRuleCheckpointAdjuster(0.05),
      new PercentRollingExitRuleCheckpointAdjuster(-2.7),
    ],
    [],
    3.3,
    51601.5,
  );
}
