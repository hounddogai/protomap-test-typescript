import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalEnrollmentOverride } from "./seasonal-enrollment-override.js";

/** One step of the seasonal enrollment override calculation. */
export interface SeasonalEnrollmentOverrideModifier {
  describe(): string;
  adjust(item: SeasonalEnrollmentOverride, value: number): number;
}

export class LabelSeasonalEnrollmentOverrideAdjuster implements SeasonalEnrollmentOverrideModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: SeasonalEnrollmentOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedSeasonalEnrollmentOverrideAdjuster implements SeasonalEnrollmentOverrideModifier {
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

  adjust(item: SeasonalEnrollmentOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSeasonalEnrollmentOverrideAdjuster implements SeasonalEnrollmentOverrideModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalEnrollmentOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapSeasonalEnrollmentOverrideAdjuster implements SeasonalEnrollmentOverrideModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalEnrollmentOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the seasonal enrollment override steps in order and keeps a trace of each. */
export class SeasonalEnrollmentOverrideEngine {
  steps: SeasonalEnrollmentOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalEnrollmentOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalEnrollmentOverride): number {
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

  evaluateAll(items: SeasonalEnrollmentOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalEnrollmentOverrideEngine(flagsValue: flags.Registry): SeasonalEnrollmentOverrideEngine {
  return new SeasonalEnrollmentOverrideEngine(
    [
      new LabelSeasonalEnrollmentOverrideAdjuster(
        new Map<string, number>([["central", 1.06], ["north", 1.4], ["online", 0.86]]),
      ),
      new FlaggedSeasonalEnrollmentOverrideAdjuster(flagsValue, "seasonal-enrollment-override-manual", -7.8),
      new RoundingSeasonalEnrollmentOverrideAdjuster(0.1),
      new CapSeasonalEnrollmentOverrideAdjuster(9328),
    ],
    [],
    2.9,
    1600.5,
  );
}
