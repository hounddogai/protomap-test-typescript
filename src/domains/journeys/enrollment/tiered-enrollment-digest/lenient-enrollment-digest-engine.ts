import * as flags from "../../../../kit/flags.js";
import { LenientEnrollmentDigest } from "./lenient-enrollment-digest.js";

/** One step of the lenient enrollment digest calculation. */
export interface LenientEnrollmentDigestModifier {
  describe(): string;
  adjust(item: LenientEnrollmentDigest, value: number): number;
}

export class MinimumLenientEnrollmentDigestAdjuster implements LenientEnrollmentDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientEnrollmentDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLenientEnrollmentDigestAdjuster implements LenientEnrollmentDigestModifier {
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

  adjust(item: LenientEnrollmentDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientEnrollmentDigestAdjuster implements LenientEnrollmentDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientEnrollmentDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient enrollment digest steps in order and keeps a trace of each. */
export class LenientEnrollmentDigestEngine {
  steps: LenientEnrollmentDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientEnrollmentDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientEnrollmentDigest): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: LenientEnrollmentDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientEnrollmentDigestEngine(flagsValue: flags.Registry): LenientEnrollmentDigestEngine {
  return new LenientEnrollmentDigestEngine(
    [
      new MinimumLenientEnrollmentDigestAdjuster(43.6),
      new FlaggedLenientEnrollmentDigestAdjuster(flagsValue, "lenient-enrollment-digest-strict", 6),
      new CapLenientEnrollmentDigestAdjuster(49323),
    ],
    [],
    4,
    55937.2,
  );
}
