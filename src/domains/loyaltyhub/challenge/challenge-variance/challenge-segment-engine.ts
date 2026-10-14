import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ChallengeSegment } from "./challenge-segment.js";

/** One step of the challenge segment calculation. */
export interface ChallengeSegmentAdjuster {
  describe(): string;
  adjust(item: ChallengeSegment, value: number): number;
}

export class RoundingChallengeSegmentAdjuster implements ChallengeSegmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengeSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedChallengeSegmentAdjuster implements ChallengeSegmentAdjuster {
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

  adjust(item: ChallengeSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentChallengeSegmentAdjuster implements ChallengeSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ChallengeSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredChallengeSegmentAdjuster implements ChallengeSegmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapChallengeSegmentAdjuster implements ChallengeSegmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the challenge segment steps in order and keeps a trace of each. */
export class ChallengeSegmentEngine {
  steps: ChallengeSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ChallengeSegment): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ChallengeSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultChallengeSegmentEngine(flagsValue: flags.Registry): ChallengeSegmentEngine {
  return new ChallengeSegmentEngine(
    [
      new RoundingChallengeSegmentAdjuster(0.05),
      new FlaggedChallengeSegmentAdjuster(flagsValue, "challenge-segment-lenient", 8.7),
      new PercentChallengeSegmentAdjuster(-7.8),
      new TieredChallengeSegmentAdjuster([6376, 8627, 9056, 9844], [1.02, 0.89, 0.82, 1.2]),
      new CapChallengeSegmentAdjuster(42625),
    ],
    [],
    3.1,
    66259.6,
  );
}
