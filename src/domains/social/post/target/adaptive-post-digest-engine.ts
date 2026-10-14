import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptivePostDigest } from "./adaptive-post-digest.js";

/** One step of the adaptive post digest calculation. */
export interface AdaptivePostDigestModifier {
  describe(): string;
  adjust(item: AdaptivePostDigest, value: number): number;
}

export class UtmSourceAdaptivePostDigestAdjuster implements AdaptivePostDigestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: AdaptivePostDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingAdaptivePostDigestAdjuster implements AdaptivePostDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptivePostDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentAdaptivePostDigestAdjuster implements AdaptivePostDigestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptivePostDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedAdaptivePostDigestAdjuster implements AdaptivePostDigestModifier {
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

  adjust(item: AdaptivePostDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumAdaptivePostDigestAdjuster implements AdaptivePostDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptivePostDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class AdaptivePostDigestMaximumOffsetAdjuster implements AdaptivePostDigestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: AdaptivePostDigest, value: number): number {
    return value + item.maximum * this.weight;
  }
}

/** Runs the adaptive post digest steps in order and keeps a trace of each. */
export class AdaptivePostDigestEngine {
  steps: AdaptivePostDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptivePostDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptivePostDigest): number {
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

  evaluateAll(items: AdaptivePostDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptivePostDigestEngine(flagsValue: flags.Registry): AdaptivePostDigestEngine {
  return new AdaptivePostDigestEngine(
    [
      new UtmSourceAdaptivePostDigestAdjuster(
        new Map<string, number>([["online", 0.83], ["east", 1.26], ["west", 0.96]]),
      ),
      new RoundingAdaptivePostDigestAdjuster(0.05),
      new PercentAdaptivePostDigestAdjuster(-22.2),
      new FlaggedAdaptivePostDigestAdjuster(flagsValue, "adaptive-post-digest-weighted", -0.9),
      new MinimumAdaptivePostDigestAdjuster(12.7),
      new AdaptivePostDigestMaximumOffsetAdjuster(0.28),
    ],
    [],
    5,
    74368.7,
  );
}
