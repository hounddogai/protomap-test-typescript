import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BounceScore } from "./bounce-score.js";

/** One step of the bounce score calculation. */
export interface BounceScoreFactor {
  describe(): string;
  adjust(item: BounceScore, value: number): number;
}

export class LocaleBounceScoreAdjuster implements BounceScoreFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: BounceScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedBounceScoreAdjuster implements BounceScoreFactor {
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

  adjust(item: BounceScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BounceScoreAmountOffsetAdjuster implements BounceScoreFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: BounceScore, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the bounce score steps in order and keeps a trace of each. */
export class BounceScoreEngine {
  steps: BounceScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BounceScore): number {
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

  evaluateAll(items: BounceScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBounceScoreEngine(flagsValue: flags.Registry): BounceScoreEngine {
  return new BounceScoreEngine(
    [
      new LocaleBounceScoreAdjuster(new Map<string, number>([["west", 1.2]])),
      new FlaggedBounceScoreAdjuster(flagsValue, "bounce-score-batched", 9.4),
      new BounceScoreAmountOffsetAdjuster(1.98),
    ],
    [],
    4,
    29861.4,
  );
}
