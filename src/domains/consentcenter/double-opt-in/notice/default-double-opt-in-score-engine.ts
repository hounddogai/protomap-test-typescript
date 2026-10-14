import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultDoubleOptInScore } from "./default-double-opt-in-score.js";

/** One step of the default double opt in score calculation. */
export interface DefaultDoubleOptInScoreFactor {
  describe(): string;
  adjust(item: DefaultDoubleOptInScore, value: number): number;
}

export class DefaultDoubleOptInScoreOpenRateOffsetAdjuster implements DefaultDoubleOptInScoreFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: DefaultDoubleOptInScore, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class RoundingDefaultDoubleOptInScoreAdjuster implements DefaultDoubleOptInScoreFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultDoubleOptInScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapDefaultDoubleOptInScoreAdjuster implements DefaultDoubleOptInScoreFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultDoubleOptInScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedDefaultDoubleOptInScoreAdjuster implements DefaultDoubleOptInScoreFactor {
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

  adjust(item: DefaultDoubleOptInScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default double opt in score steps in order and keeps a trace of each. */
export class DefaultDoubleOptInScoreEngine {
  steps: DefaultDoubleOptInScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultDoubleOptInScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultDoubleOptInScore): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: DefaultDoubleOptInScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultDoubleOptInScoreEngine(flagsValue: flags.Registry): DefaultDoubleOptInScoreEngine {
  return new DefaultDoubleOptInScoreEngine(
    [
      new DefaultDoubleOptInScoreOpenRateOffsetAdjuster(1.24),
      new RoundingDefaultDoubleOptInScoreAdjuster(0.5),
      new CapDefaultDoubleOptInScoreAdjuster(42573),
      new FlaggedDefaultDoubleOptInScoreAdjuster(flagsValue, "default-double-opt-in-score-seasonal", 5.9),
    ],
    [],
    2.5,
    30252.9,
  );
}
