import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingFlightScore } from "./rolling-flight-score.js";

/** One step of the rolling flight score calculation. */
export interface RollingFlightScoreStep {
  describe(): string;
  adjust(item: RollingFlightScore, value: number): number;
}

export class FlaggedRollingFlightScoreAdjuster implements RollingFlightScoreStep {
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

  adjust(item: RollingFlightScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionRollingFlightScoreAdjuster implements RollingFlightScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RollingFlightScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRollingFlightScoreAdjuster implements RollingFlightScoreStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingFlightScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling flight score steps in order and keeps a trace of each. */
export class RollingFlightScoreEngine {
  steps: RollingFlightScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingFlightScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingFlightScore): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RollingFlightScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingFlightScoreEngine(flagsValue: flags.Registry): RollingFlightScoreEngine {
  return new RollingFlightScoreEngine(
    [
      new FlaggedRollingFlightScoreAdjuster(flagsValue, "rolling-flight-score-legacy", 5),
      new RegionRollingFlightScoreAdjuster(new Map<string, number>([["retail", 0.75], ["north", 1.33]])),
      new MinimumRollingFlightScoreAdjuster(43.1),
    ],
    [],
    1.7,
    91956.8,
  );
}
