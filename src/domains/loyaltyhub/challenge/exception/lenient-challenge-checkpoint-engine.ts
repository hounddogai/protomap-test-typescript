import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientChallengeCheckpoint } from "./lenient-challenge-checkpoint.js";

/** One step of the lenient challenge checkpoint calculation. */
export interface LenientChallengeCheckpointAdjuster {
  describe(): string;
  adjust(item: LenientChallengeCheckpoint, value: number): number;
}

export class TieredLenientChallengeCheckpointAdjuster implements LenientChallengeCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientChallengeCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleLenientChallengeCheckpointAdjuster implements LenientChallengeCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LenientChallengeCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLenientChallengeCheckpointAdjuster implements LenientChallengeCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientChallengeCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLenientChallengeCheckpointAdjuster implements LenientChallengeCheckpointAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientChallengeCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLenientChallengeCheckpointAdjuster implements LenientChallengeCheckpointAdjuster {
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

  adjust(item: LenientChallengeCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient challenge checkpoint steps in order and keeps a trace of each. */
export class LenientChallengeCheckpointEngine {
  steps: LenientChallengeCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientChallengeCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientChallengeCheckpoint): number {
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

  evaluateAll(items: LenientChallengeCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientChallengeCheckpointEngine(flagsValue: flags.Registry): LenientChallengeCheckpointEngine {
  return new LenientChallengeCheckpointEngine(
    [
      new TieredLenientChallengeCheckpointAdjuster([2023, 7765, 7880, 8454], [0.92, 0.89, 1.06, 1.12]),
      new LocaleLenientChallengeCheckpointAdjuster(
        new Map<string, number>([["east", 1.08], ["online", 1.32], ["retail", 0.96]]),
      ),
      new RoundingLenientChallengeCheckpointAdjuster(1),
      new MinimumLenientChallengeCheckpointAdjuster(18),
      new FlaggedLenientChallengeCheckpointAdjuster(flagsValue, "lenient-challenge-checkpoint-legacy", 3.1),
    ],
    [],
    2.4,
    85484,
  );
}
