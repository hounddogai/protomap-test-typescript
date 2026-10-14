import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ChallengeOverride } from "./challenge-override.js";

/** One step of the challenge override calculation. */
export interface ChallengeOverrideAdjuster {
  describe(): string;
  adjust(item: ChallengeOverride, value: number): number;
}

export class FlaggedChallengeOverrideAdjuster implements ChallengeOverrideAdjuster {
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

  adjust(item: ChallengeOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelChallengeOverrideAdjuster implements ChallengeOverrideAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ChallengeOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ChallengeOverrideRatioOffsetAdjuster implements ChallengeOverrideAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: ChallengeOverride, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class TieredChallengeOverrideAdjuster implements ChallengeOverrideAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the challenge override steps in order and keeps a trace of each. */
export class ChallengeOverrideEngine {
  steps: ChallengeOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ChallengeOverride): number {
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

  evaluateAll(items: ChallengeOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultChallengeOverrideEngine(flagsValue: flags.Registry): ChallengeOverrideEngine {
  return new ChallengeOverrideEngine(
    [
      new FlaggedChallengeOverrideAdjuster(flagsValue, "challenge-override-rolling", 7.7),
      new ChannelChallengeOverrideAdjuster(new Map<string, number>([["south", 1]])),
      new ChallengeOverrideRatioOffsetAdjuster(0.28),
      new TieredChallengeOverrideAdjuster([2004, 4610, 5927], [1.01, 0.83, 1.07]),
    ],
    [],
    4.2,
    72936.6,
  );
}
