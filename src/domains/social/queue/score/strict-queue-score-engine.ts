import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictQueueScore } from "./strict-queue-score.js";

/** One step of the strict queue score calculation. */
export interface StrictQueueScoreStep {
  describe(): string;
  adjust(item: StrictQueueScore, value: number): number;
}

export class StrictQueueScoreMarginOffsetAdjuster implements StrictQueueScoreStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: StrictQueueScore, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedStrictQueueScoreAdjuster implements StrictQueueScoreStep {
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

  adjust(item: StrictQueueScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingStrictQueueScoreAdjuster implements StrictQueueScoreStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictQueueScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapStrictQueueScoreAdjuster implements StrictQueueScoreStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictQueueScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentStrictQueueScoreAdjuster implements StrictQueueScoreStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictQueueScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict queue score steps in order and keeps a trace of each. */
export class StrictQueueScoreEngine {
  steps: StrictQueueScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictQueueScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictQueueScore): number {
    let current = item.netValue();
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

  evaluateAll(items: StrictQueueScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictQueueScoreEngine(flagsValue: flags.Registry): StrictQueueScoreEngine {
  return new StrictQueueScoreEngine(
    [
      new StrictQueueScoreMarginOffsetAdjuster(1.53),
      new FlaggedStrictQueueScoreAdjuster(flagsValue, "strict-queue-score-weighted", -4.9),
      new RoundingStrictQueueScoreAdjuster(0.25),
      new CapStrictQueueScoreAdjuster(26045),
      new PercentStrictQueueScoreAdjuster(9.2),
    ],
    [],
    1.3,
    72807.3,
  );
}
