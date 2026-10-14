import * as numbers from "../../../../kit/numbers.js";
import { ChallengeSnapshot } from "./challenge-snapshot.js";

/** One step of the challenge snapshot calculation. */
export interface ChallengeSnapshotAdjuster {
  describe(): string;
  adjust(item: ChallengeSnapshot, value: number): number;
}

export class PercentChallengeSnapshotAdjuster implements ChallengeSnapshotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ChallengeSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredChallengeSnapshotAdjuster implements ChallengeSnapshotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingChallengeSnapshotAdjuster implements ChallengeSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengeSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the challenge snapshot steps in order and keeps a trace of each. */
export class ChallengeSnapshotEngine {
  steps: ChallengeSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ChallengeSnapshot): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ChallengeSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultChallengeSnapshotEngine(): ChallengeSnapshotEngine {
  return new ChallengeSnapshotEngine(
    [
      new PercentChallengeSnapshotAdjuster(9.6),
      new TieredChallengeSnapshotAdjuster([158, 588], [1.07, 1.14]),
      new RoundingChallengeSnapshotAdjuster(0.5),
    ],
    [],
    2.6,
    59543,
  );
}
