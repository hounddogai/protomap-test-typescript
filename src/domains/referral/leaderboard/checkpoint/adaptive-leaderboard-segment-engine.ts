import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveLeaderboardSegment } from "./adaptive-leaderboard-segment.js";

/** One step of the adaptive leaderboard segment calculation. */
export interface AdaptiveLeaderboardSegmentAdjuster {
  describe(): string;
  adjust(item: AdaptiveLeaderboardSegment, value: number): number;
}

export class RoundingAdaptiveLeaderboardSegmentAdjuster implements AdaptiveLeaderboardSegmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveLeaderboardSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedAdaptiveLeaderboardSegmentAdjuster implements AdaptiveLeaderboardSegmentAdjuster {
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

  adjust(item: AdaptiveLeaderboardSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapAdaptiveLeaderboardSegmentAdjuster implements AdaptiveLeaderboardSegmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveLeaderboardSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredAdaptiveLeaderboardSegmentAdjuster implements AdaptiveLeaderboardSegmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveLeaderboardSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentAdaptiveLeaderboardSegmentAdjuster implements AdaptiveLeaderboardSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveLeaderboardSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptiveLeaderboardSegmentAdjuster implements AdaptiveLeaderboardSegmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveLeaderboardSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive leaderboard segment steps in order and keeps a trace of each. */
export class AdaptiveLeaderboardSegmentEngine {
  steps: AdaptiveLeaderboardSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveLeaderboardSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveLeaderboardSegment): number {
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

  evaluateAll(items: AdaptiveLeaderboardSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveLeaderboardSegmentEngine(flagsValue: flags.Registry): AdaptiveLeaderboardSegmentEngine {
  return new AdaptiveLeaderboardSegmentEngine(
    [
      new RoundingAdaptiveLeaderboardSegmentAdjuster(1),
      new FlaggedAdaptiveLeaderboardSegmentAdjuster(flagsValue, "adaptive-leaderboard-segment-fallback", 4.8),
      new CapAdaptiveLeaderboardSegmentAdjuster(27789),
      new TieredAdaptiveLeaderboardSegmentAdjuster([2259, 4178, 4249], [0.8, 0.96, 0.82]),
      new PercentAdaptiveLeaderboardSegmentAdjuster(-10.7),
      new MinimumAdaptiveLeaderboardSegmentAdjuster(39),
    ],
    [],
    2.6,
    98495.3,
  );
}
