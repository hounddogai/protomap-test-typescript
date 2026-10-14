import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientChallengeScore } from "./lenient-challenge-score.js";

/** One step of the lenient challenge score calculation. */
export interface LenientChallengeScoreModifier {
  describe(): string;
  adjust(item: LenientChallengeScore, value: number): number;
}

export class FlaggedLenientChallengeScoreAdjuster implements LenientChallengeScoreModifier {
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

  adjust(item: LenientChallengeScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLenientChallengeScoreAdjuster implements LenientChallengeScoreModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientChallengeScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientChallengeScoreAdjuster implements LenientChallengeScoreModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientChallengeScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameLenientChallengeScoreAdjuster implements LenientChallengeScoreModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LenientChallengeScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient challenge score steps in order and keeps a trace of each. */
export class LenientChallengeScoreEngine {
  steps: LenientChallengeScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientChallengeScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientChallengeScore): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: LenientChallengeScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientChallengeScoreEngine(flagsValue: flags.Registry): LenientChallengeScoreEngine {
  return new LenientChallengeScoreEngine(
    [
      new FlaggedLenientChallengeScoreAdjuster(flagsValue, "lenient-challenge-score-global", -6.3),
      new PercentLenientChallengeScoreAdjuster(-15.1),
      new RoundingLenientChallengeScoreAdjuster(0.05),
      new NameLenientChallengeScoreAdjuster(
        new Map<string, number>([["east", 0.73], ["south", 1.19], ["north", 0.74]]),
      ),
    ],
    [],
    4.3,
    94913.6,
  );
}
