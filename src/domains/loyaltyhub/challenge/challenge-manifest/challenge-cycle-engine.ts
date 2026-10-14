import { ChallengeCycle } from "./challenge-cycle.js";

/** One step of the challenge cycle calculation. */
export interface ChallengeCycleFactor {
  describe(): string;
  adjust(item: ChallengeCycle, value: number): number;
}

export class MinimumChallengeCycleAdjuster implements ChallengeCycleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ChallengeCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChallengeCycleFloorValueOffsetAdjuster implements ChallengeCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: ChallengeCycle, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class PercentChallengeCycleAdjuster implements ChallengeCycleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ChallengeCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the challenge cycle steps in order and keeps a trace of each. */
export class ChallengeCycleEngine {
  steps: ChallengeCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ChallengeCycle): number {
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

  evaluateAll(items: ChallengeCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultChallengeCycleEngine(): ChallengeCycleEngine {
  return new ChallengeCycleEngine(
    [
      new MinimumChallengeCycleAdjuster(32.4),
      new ChallengeCycleFloorValueOffsetAdjuster(1.16),
      new PercentChallengeCycleAdjuster(9.6),
    ],
    [],
    3.9,
    31582.2,
  );
}
