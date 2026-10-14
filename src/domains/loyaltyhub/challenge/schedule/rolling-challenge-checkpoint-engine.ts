import * as numbers from "../../../../kit/numbers.js";
import { RollingChallengeCheckpoint } from "./rolling-challenge-checkpoint.js";

/** One step of the rolling challenge checkpoint calculation. */
export interface RollingChallengeCheckpointFactor {
  describe(): string;
  adjust(item: RollingChallengeCheckpoint, value: number): number;
}

export class PercentRollingChallengeCheckpointAdjuster implements RollingChallengeCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingChallengeCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingChallengeCheckpointAdjuster implements RollingChallengeCheckpointFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingChallengeCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRollingChallengeCheckpointAdjuster implements RollingChallengeCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingChallengeCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the rolling challenge checkpoint steps in order and keeps a trace of each. */
export class RollingChallengeCheckpointEngine {
  steps: RollingChallengeCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingChallengeCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingChallengeCheckpoint): number {
    let current = item.projectedValue();
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

  evaluateAll(items: RollingChallengeCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingChallengeCheckpointEngine(): RollingChallengeCheckpointEngine {
  return new RollingChallengeCheckpointEngine(
    [
      new PercentRollingChallengeCheckpointAdjuster(15.3),
      new RoundingRollingChallengeCheckpointAdjuster(0.1),
      new CapRollingChallengeCheckpointAdjuster(27378),
    ],
    [],
    2.4,
    10152.6,
  );
}
