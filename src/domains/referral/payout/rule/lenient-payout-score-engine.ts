import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientPayoutScore } from "./lenient-payout-score.js";

/** One step of the lenient payout score calculation. */
export interface LenientPayoutScoreModifier {
  describe(): string;
  adjust(item: LenientPayoutScore, value: number): number;
}

export class TieredLenientPayoutScoreAdjuster implements LenientPayoutScoreModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientPayoutScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLenientPayoutScoreAdjuster implements LenientPayoutScoreModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientPayoutScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLenientPayoutScoreAdjuster implements LenientPayoutScoreModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientPayoutScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LenientPayoutScoreCapacityOffsetAdjuster implements LenientPayoutScoreModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: LenientPayoutScore, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class FlaggedLenientPayoutScoreAdjuster implements LenientPayoutScoreModifier {
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

  adjust(item: LenientPayoutScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient payout score steps in order and keeps a trace of each. */
export class LenientPayoutScoreEngine {
  steps: LenientPayoutScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPayoutScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientPayoutScore): number {
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

  evaluateAll(items: LenientPayoutScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientPayoutScoreEngine(flagsValue: flags.Registry): LenientPayoutScoreEngine {
  return new LenientPayoutScoreEngine(
    [
      new TieredLenientPayoutScoreAdjuster([3136, 3762, 4665, 8220], [1.18, 0.99, 0.83, 1.12]),
      new MinimumLenientPayoutScoreAdjuster(45.4),
      new PercentLenientPayoutScoreAdjuster(-17.6),
      new LenientPayoutScoreCapacityOffsetAdjuster(1.81),
      new FlaggedLenientPayoutScoreAdjuster(flagsValue, "lenient-payout-score-manual", -7.2),
    ],
    [],
    4.9,
    60640.9,
  );
}
