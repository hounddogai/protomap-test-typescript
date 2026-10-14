import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ChallengeBundle } from "./challenge-bundle.js";

/** One step of the challenge bundle calculation. */
export interface ChallengeBundleStep {
  describe(): string;
  adjust(item: ChallengeBundle, value: number): number;
}

export class MinimumChallengeBundleAdjuster implements ChallengeBundleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ChallengeBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedChallengeBundleAdjuster implements ChallengeBundleStep {
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

  adjust(item: ChallengeBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingChallengeBundleAdjuster implements ChallengeBundleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengeBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapChallengeBundleAdjuster implements ChallengeBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredChallengeBundleAdjuster implements ChallengeBundleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the challenge bundle steps in order and keeps a trace of each. */
export class ChallengeBundleEngine {
  steps: ChallengeBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ChallengeBundle): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ChallengeBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultChallengeBundleEngine(flagsValue: flags.Registry): ChallengeBundleEngine {
  return new ChallengeBundleEngine(
    [
      new MinimumChallengeBundleAdjuster(2.7),
      new FlaggedChallengeBundleAdjuster(flagsValue, "challenge-bundle-lenient", 2.3),
      new RoundingChallengeBundleAdjuster(0.1),
      new CapChallengeBundleAdjuster(20117),
      new TieredChallengeBundleAdjuster([2307, 3615, 4421], [1.08, 1.04, 0.84]),
    ],
    [],
    3.3,
    14670.7,
  );
}
