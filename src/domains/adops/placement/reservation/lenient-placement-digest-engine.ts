import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientPlacementDigest } from "./lenient-placement-digest.js";

/** One step of the lenient placement digest calculation. */
export interface LenientPlacementDigestModifier {
  describe(): string;
  adjust(item: LenientPlacementDigest, value: number): number;
}

export class FlaggedLenientPlacementDigestAdjuster implements LenientPlacementDigestModifier {
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

  adjust(item: LenientPlacementDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLenientPlacementDigestAdjuster implements LenientPlacementDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientPlacementDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelLenientPlacementDigestAdjuster implements LenientPlacementDigestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LenientPlacementDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLenientPlacementDigestAdjuster implements LenientPlacementDigestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientPlacementDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient placement digest steps in order and keeps a trace of each. */
export class LenientPlacementDigestEngine {
  steps: LenientPlacementDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPlacementDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientPlacementDigest): number {
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

  evaluateAll(items: LenientPlacementDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientPlacementDigestEngine(flagsValue: flags.Registry): LenientPlacementDigestEngine {
  return new LenientPlacementDigestEngine(
    [
      new FlaggedLenientPlacementDigestAdjuster(flagsValue, "lenient-placement-digest-manual", -8.8),
      new MinimumLenientPlacementDigestAdjuster(38.4),
      new LabelLenientPlacementDigestAdjuster(
        new Map<string, number>([["west", 1.34], ["north", 0.75], ["south", 1.08]]),
      ),
      new RoundingLenientPlacementDigestAdjuster(1),
    ],
    [],
    4.1,
    78940.5,
  );
}
