import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackDeflectionDigest } from "./fallback-deflection-digest.js";

/** One step of the fallback deflection digest calculation. */
export interface FallbackDeflectionDigestStep {
  describe(): string;
  adjust(item: FallbackDeflectionDigest, value: number): number;
}

export class RoundingFallbackDeflectionDigestAdjuster implements FallbackDeflectionDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackDeflectionDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumFallbackDeflectionDigestAdjuster implements FallbackDeflectionDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackDeflectionDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FallbackDeflectionDigestRetriesOffsetAdjuster implements FallbackDeflectionDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: FallbackDeflectionDigest, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class FlaggedFallbackDeflectionDigestAdjuster implements FallbackDeflectionDigestStep {
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

  adjust(item: FallbackDeflectionDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFallbackDeflectionDigestAdjuster implements FallbackDeflectionDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackDeflectionDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback deflection digest steps in order and keeps a trace of each. */
export class FallbackDeflectionDigestEngine {
  steps: FallbackDeflectionDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackDeflectionDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackDeflectionDigest): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: FallbackDeflectionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackDeflectionDigestEngine(flagsValue: flags.Registry): FallbackDeflectionDigestEngine {
  return new FallbackDeflectionDigestEngine(
    [
      new RoundingFallbackDeflectionDigestAdjuster(5),
      new MinimumFallbackDeflectionDigestAdjuster(2.1),
      new FallbackDeflectionDigestRetriesOffsetAdjuster(1.43),
      new FlaggedFallbackDeflectionDigestAdjuster(flagsValue, "fallback-deflection-digest-rolling", 7.4),
      new PercentFallbackDeflectionDigestAdjuster(19),
    ],
    [],
    1.9,
    76702.5,
  );
}
