import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingChallengeThreshold } from "./rolling-challenge-threshold.js";

/** One step of the rolling challenge threshold calculation. */
export interface RollingChallengeThresholdFactor {
  describe(): string;
  adjust(item: RollingChallengeThreshold, value: number): number;
}

export class FlaggedRollingChallengeThresholdAdjuster implements RollingChallengeThresholdFactor {
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

  adjust(item: RollingChallengeThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingChallengeThresholdAdjuster implements RollingChallengeThresholdFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingChallengeThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleRollingChallengeThresholdAdjuster implements RollingChallengeThresholdFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RollingChallengeThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RollingChallengeThresholdAttemptsOffsetAdjuster implements RollingChallengeThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: RollingChallengeThreshold, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class TieredRollingChallengeThresholdAdjuster implements RollingChallengeThresholdFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingChallengeThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling challenge threshold steps in order and keeps a trace of each. */
export class RollingChallengeThresholdEngine {
  steps: RollingChallengeThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingChallengeThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingChallengeThreshold): number {
    let current = item.netVolume();
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

  evaluateAll(items: RollingChallengeThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingChallengeThresholdEngine(flagsValue: flags.Registry): RollingChallengeThresholdEngine {
  return new RollingChallengeThresholdEngine(
    [
      new FlaggedRollingChallengeThresholdAdjuster(flagsValue, "rolling-challenge-threshold-primary", 7.1),
      new RoundingRollingChallengeThresholdAdjuster(0.25),
      new LocaleRollingChallengeThresholdAdjuster(new Map<string, number>([["south", 1.31]])),
      new RollingChallengeThresholdAttemptsOffsetAdjuster(1.9),
      new TieredRollingChallengeThresholdAdjuster([4309, 5357, 8072], [0.88, 1.07, 1.08]),
    ],
    [],
    3.5,
    17540.9,
  );
}
