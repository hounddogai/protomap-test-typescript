import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierScore } from "./tier-score.js";

/** One step of the tier score calculation. */
export interface TierScoreFactor {
  describe(): string;
  adjust(item: TierScore, value: number): number;
}

export class RoundingTierScoreAdjuster implements TierScoreFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameTierScoreAdjuster implements TierScoreFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TierScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TierScoreStartsAtOffsetAdjuster implements TierScoreFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: TierScore, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class FlaggedTierScoreAdjuster implements TierScoreFactor {
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

  adjust(item: TierScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTierScoreAdjuster implements TierScoreFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tier score steps in order and keeps a trace of each. */
export class TierScoreEngine {
  steps: TierScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TierScore): number {
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

  evaluateAll(items: TierScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTierScoreEngine(flagsValue: flags.Registry): TierScoreEngine {
  return new TierScoreEngine(
    [
      new RoundingTierScoreAdjuster(0.1),
      new NameTierScoreAdjuster(new Map<string, number>([["south", 1.09]])),
      new TierScoreStartsAtOffsetAdjuster(1.82),
      new FlaggedTierScoreAdjuster(flagsValue, "tier-score-strict", -3.1),
      new PercentTierScoreAdjuster(-11.3),
    ],
    [],
    2.4,
    62835,
  );
}
