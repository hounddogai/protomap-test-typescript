import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackSenderBundle } from "./fallback-sender-bundle.js";

/** One step of the fallback sender bundle calculation. */
export interface FallbackSenderBundleFactor {
  describe(): string;
  adjust(item: FallbackSenderBundle, value: number): number;
}

export class FlaggedFallbackSenderBundleAdjuster implements FallbackSenderBundleFactor {
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

  adjust(item: FallbackSenderBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackSenderBundleAdjuster implements FallbackSenderBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackSenderBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleFallbackSenderBundleAdjuster implements FallbackSenderBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: FallbackSenderBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFallbackSenderBundleAdjuster implements FallbackSenderBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackSenderBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback sender bundle steps in order and keeps a trace of each. */
export class FallbackSenderBundleEngine {
  steps: FallbackSenderBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSenderBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackSenderBundle): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: FallbackSenderBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackSenderBundleEngine(flagsValue: flags.Registry): FallbackSenderBundleEngine {
  return new FallbackSenderBundleEngine(
    [
      new FlaggedFallbackSenderBundleAdjuster(flagsValue, "fallback-sender-bundle-regional", 0.5),
      new RoundingFallbackSenderBundleAdjuster(0.25),
      new TitleFallbackSenderBundleAdjuster(new Map<string, number>([["retail", 1.28]])),
      new MinimumFallbackSenderBundleAdjuster(24.3),
    ],
    [],
    3.2,
    71704.9,
  );
}
