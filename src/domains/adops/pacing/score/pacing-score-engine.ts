import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingScore } from "./pacing-score.js";

/** One step of the pacing score calculation. */
export interface PacingScoreAdjuster {
  describe(): string;
  adjust(item: PacingScore, value: number): number;
}

export class RoundingPacingScoreAdjuster implements PacingScoreAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPacingScoreAdjuster implements PacingScoreAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PacingScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPacingScoreAdjuster implements PacingScoreAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PacingScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPacingScoreAdjuster implements PacingScoreAdjuster {
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

  adjust(item: PacingScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PacingScoreBidOffsetAdjuster implements PacingScoreAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: PacingScore, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class MinimumPacingScoreAdjuster implements PacingScoreAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pacing score steps in order and keeps a trace of each. */
export class PacingScoreEngine {
  steps: PacingScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PacingScore): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PacingScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPacingScoreEngine(flagsValue: flags.Registry): PacingScoreEngine {
  return new PacingScoreEngine(
    [
      new RoundingPacingScoreAdjuster(0.05),
      new TieredPacingScoreAdjuster([600, 1710], [1.11, 1.15]),
      new PercentPacingScoreAdjuster(-6.7),
      new FlaggedPacingScoreAdjuster(flagsValue, "pacing-score-batched", -1),
      new PacingScoreBidOffsetAdjuster(0.81),
      new MinimumPacingScoreAdjuster(10.4),
    ],
    [],
    0.7,
    44672.5,
  );
}
