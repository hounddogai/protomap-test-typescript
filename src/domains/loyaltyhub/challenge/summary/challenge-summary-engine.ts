import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ChallengeSummary } from "./challenge-summary.js";

/** One step of the challenge summary calculation. */
export interface ChallengeSummaryModifier {
  describe(): string;
  adjust(item: ChallengeSummary, value: number): number;
}

export class ChallengeSummaryMinimumOffsetAdjuster implements ChallengeSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: ChallengeSummary, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class CapChallengeSummaryAdjuster implements ChallengeSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingChallengeSummaryAdjuster implements ChallengeSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengeSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedChallengeSummaryAdjuster implements ChallengeSummaryModifier {
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

  adjust(item: ChallengeSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the challenge summary steps in order and keeps a trace of each. */
export class ChallengeSummaryEngine {
  steps: ChallengeSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ChallengeSummary): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ChallengeSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultChallengeSummaryEngine(flagsValue: flags.Registry): ChallengeSummaryEngine {
  return new ChallengeSummaryEngine(
    [
      new ChallengeSummaryMinimumOffsetAdjuster(0.09),
      new CapChallengeSummaryAdjuster(46075),
      new RoundingChallengeSummaryAdjuster(1),
      new FlaggedChallengeSummaryAdjuster(flagsValue, "challenge-summary-fallback", -4.1),
    ],
    [],
    4.5,
    37275,
  );
}
