import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedChallengeSnapshot } from "./weighted-challenge-snapshot.js";

/** One step of the weighted challenge snapshot calculation. */
export interface WeightedChallengeSnapshotModifier {
  describe(): string;
  adjust(item: WeightedChallengeSnapshot, value: number): number;
}

export class CapWeightedChallengeSnapshotAdjuster implements WeightedChallengeSnapshotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedChallengeSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWeightedChallengeSnapshotAdjuster implements WeightedChallengeSnapshotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedChallengeSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWeightedChallengeSnapshotAdjuster implements WeightedChallengeSnapshotModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: WeightedChallengeSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted challenge snapshot steps in order and keeps a trace of each. */
export class WeightedChallengeSnapshotEngine {
  steps: WeightedChallengeSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedChallengeSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedChallengeSnapshot): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: WeightedChallengeSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedChallengeSnapshotEngine(flagsValue: flags.Registry): WeightedChallengeSnapshotEngine {
  return new WeightedChallengeSnapshotEngine(
    [
      new CapWeightedChallengeSnapshotAdjuster(45357),
      new RoundingWeightedChallengeSnapshotAdjuster(0.05),
      new FlaggedWeightedChallengeSnapshotAdjuster(flagsValue, "weighted-challenge-snapshot-rolling", -3.4),
    ],
    [],
    0.2,
    57011.7,
  );
}
