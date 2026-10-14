import * as flags from "../../../../kit/flags.js";
import { ChallengeManifest } from "./challenge-manifest.js";

/** One step of the challenge manifest calculation. */
export interface ChallengeManifestModifier {
  describe(): string;
  adjust(item: ChallengeManifest, value: number): number;
}

export class PercentChallengeManifestAdjuster implements ChallengeManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ChallengeManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredChallengeManifestAdjuster implements ChallengeManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedChallengeManifestAdjuster implements ChallengeManifestModifier {
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

  adjust(item: ChallengeManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumChallengeManifestAdjuster implements ChallengeManifestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ChallengeManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapChallengeManifestAdjuster implements ChallengeManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChallengeManifestScoreOffsetAdjuster implements ChallengeManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ChallengeManifest, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the challenge manifest steps in order and keeps a trace of each. */
export class ChallengeManifestEngine {
  steps: ChallengeManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ChallengeManifest): number {
    let current = item.netLoad();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: ChallengeManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultChallengeManifestEngine(flagsValue: flags.Registry): ChallengeManifestEngine {
  return new ChallengeManifestEngine(
    [
      new PercentChallengeManifestAdjuster(-5.5),
      new TieredChallengeManifestAdjuster([5778, 5816, 8902], [0.93, 1.11, 0.98]),
      new FlaggedChallengeManifestAdjuster(flagsValue, "challenge-manifest-batched", 8.6),
      new MinimumChallengeManifestAdjuster(35),
      new CapChallengeManifestAdjuster(4414),
      new ChallengeManifestScoreOffsetAdjuster(1.43),
    ],
    [],
    2.5,
    60471.9,
  );
}
