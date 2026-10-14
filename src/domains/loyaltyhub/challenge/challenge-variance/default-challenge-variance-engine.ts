import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultChallengeVariance } from "./default-challenge-variance.js";

/** One step of the default challenge variance calculation. */
export interface DefaultChallengeVarianceFactor {
  describe(): string;
  adjust(item: DefaultChallengeVariance, value: number): number;
}

export class DefaultChallengeVarianceFrequencyCapOffsetAdjuster implements DefaultChallengeVarianceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: DefaultChallengeVariance, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class FlaggedDefaultChallengeVarianceAdjuster implements DefaultChallengeVarianceFactor {
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

  adjust(item: DefaultChallengeVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelDefaultChallengeVarianceAdjuster implements DefaultChallengeVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: DefaultChallengeVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default challenge variance steps in order and keeps a trace of each. */
export class DefaultChallengeVarianceEngine {
  steps: DefaultChallengeVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultChallengeVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultChallengeVariance): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: DefaultChallengeVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultChallengeVarianceEngine(flagsValue: flags.Registry): DefaultChallengeVarianceEngine {
  return new DefaultChallengeVarianceEngine(
    [
      new DefaultChallengeVarianceFrequencyCapOffsetAdjuster(0.71),
      new FlaggedDefaultChallengeVarianceAdjuster(flagsValue, "default-challenge-variance-pending", 8.2),
      new ChannelDefaultChallengeVarianceAdjuster(new Map<string, number>([["north", 0.79]])),
    ],
    [],
    1.3,
    20293.2,
  );
}
