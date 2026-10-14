import * as numbers from "../../../../kit/numbers.js";
import { TieredRewardCheckpoint } from "./tiered-reward-checkpoint.js";

/** One step of the tiered reward checkpoint calculation. */
export interface TieredRewardCheckpointModifier {
  describe(): string;
  adjust(item: TieredRewardCheckpoint, value: number): number;
}

export class TieredTieredRewardCheckpointAdjuster implements TieredRewardCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredRewardCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TieredRewardCheckpointPriorityOffsetAdjuster implements TieredRewardCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: TieredRewardCheckpoint, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class PercentTieredRewardCheckpointAdjuster implements TieredRewardCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredRewardCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredRewardCheckpointAdjuster implements TieredRewardCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredRewardCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTieredRewardCheckpointAdjuster implements TieredRewardCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredRewardCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered reward checkpoint steps in order and keeps a trace of each. */
export class TieredRewardCheckpointEngine {
  steps: TieredRewardCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredRewardCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredRewardCheckpoint): number {
    let current = item.netLoad();
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

  evaluateAll(items: TieredRewardCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredRewardCheckpointEngine(): TieredRewardCheckpointEngine {
  return new TieredRewardCheckpointEngine(
    [
      new TieredTieredRewardCheckpointAdjuster([4538, 6311], [1.14, 1.07]),
      new TieredRewardCheckpointPriorityOffsetAdjuster(0.32),
      new PercentTieredRewardCheckpointAdjuster(24.6),
      new RoundingTieredRewardCheckpointAdjuster(5),
      new MinimumTieredRewardCheckpointAdjuster(11.8),
    ],
    [],
    0.8,
    83340,
  );
}
