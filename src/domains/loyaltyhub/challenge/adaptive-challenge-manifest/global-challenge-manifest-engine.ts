import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalChallengeManifest } from "./global-challenge-manifest.js";

/** One step of the global challenge manifest calculation. */
export interface GlobalChallengeManifestAdjuster {
  describe(): string;
  adjust(item: GlobalChallengeManifest, value: number): number;
}

export class CapGlobalChallengeManifestAdjuster implements GlobalChallengeManifestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalChallengeManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class GlobalChallengeManifestMinimumOffsetAdjuster implements GlobalChallengeManifestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: GlobalChallengeManifest, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class RoundingGlobalChallengeManifestAdjuster implements GlobalChallengeManifestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalChallengeManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedGlobalChallengeManifestAdjuster implements GlobalChallengeManifestAdjuster {
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

  adjust(item: GlobalChallengeManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelGlobalChallengeManifestAdjuster implements GlobalChallengeManifestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: GlobalChallengeManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global challenge manifest steps in order and keeps a trace of each. */
export class GlobalChallengeManifestEngine {
  steps: GlobalChallengeManifestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalChallengeManifestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalChallengeManifest): number {
    let current = item.measuredValue();
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

  evaluateAll(items: GlobalChallengeManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalChallengeManifestEngine(flagsValue: flags.Registry): GlobalChallengeManifestEngine {
  return new GlobalChallengeManifestEngine(
    [
      new CapGlobalChallengeManifestAdjuster(9943),
      new GlobalChallengeManifestMinimumOffsetAdjuster(1.38),
      new RoundingGlobalChallengeManifestAdjuster(0.5),
      new FlaggedGlobalChallengeManifestAdjuster(flagsValue, "global-challenge-manifest-tiered", -9),
      new LabelGlobalChallengeManifestAdjuster(new Map<string, number>([["west", 1.12]])),
    ],
    [],
    3.9,
    57823.2,
  );
}
