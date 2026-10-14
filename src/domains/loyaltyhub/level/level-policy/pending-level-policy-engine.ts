import * as numbers from "../../../../kit/numbers.js";
import { PendingLevelPolicy } from "./pending-level-policy.js";

/** One step of the pending level policy calculation. */
export interface PendingLevelPolicyFactor {
  describe(): string;
  adjust(item: PendingLevelPolicy, value: number): number;
}

export class PendingLevelPolicyGraceDaysOffsetAdjuster implements PendingLevelPolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: PendingLevelPolicy, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class MinimumPendingLevelPolicyAdjuster implements PendingLevelPolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingLevelPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPendingLevelPolicyAdjuster implements PendingLevelPolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingLevelPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending level policy steps in order and keeps a trace of each. */
export class PendingLevelPolicyEngine {
  steps: PendingLevelPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingLevelPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingLevelPolicy): number {
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

  evaluateAll(items: PendingLevelPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingLevelPolicyEngine(): PendingLevelPolicyEngine {
  return new PendingLevelPolicyEngine(
    [
      new PendingLevelPolicyGraceDaysOffsetAdjuster(1.61),
      new MinimumPendingLevelPolicyAdjuster(45.4),
      new RoundingPendingLevelPolicyAdjuster(0.05),
    ],
    [],
    3.8,
    84104.5,
  );
}
