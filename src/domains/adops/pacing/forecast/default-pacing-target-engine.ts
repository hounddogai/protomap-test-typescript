import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPacingTarget } from "./default-pacing-target.js";

/** One step of the default pacing target calculation. */
export interface DefaultPacingTargetFactor {
  describe(): string;
  adjust(item: DefaultPacingTarget, value: number): number;
}

export class MinimumDefaultPacingTargetAdjuster implements DefaultPacingTargetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultPacingTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingDefaultPacingTargetAdjuster implements DefaultPacingTargetFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultPacingTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDefaultPacingTargetAdjuster implements DefaultPacingTargetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultPacingTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleDefaultPacingTargetAdjuster implements DefaultPacingTargetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: DefaultPacingTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedDefaultPacingTargetAdjuster implements DefaultPacingTargetFactor {
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

  adjust(item: DefaultPacingTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default pacing target steps in order and keeps a trace of each. */
export class DefaultPacingTargetEngine {
  steps: DefaultPacingTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPacingTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultPacingTarget): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: DefaultPacingTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultPacingTargetEngine(flagsValue: flags.Registry): DefaultPacingTargetEngine {
  return new DefaultPacingTargetEngine(
    [
      new MinimumDefaultPacingTargetAdjuster(45.8),
      new RoundingDefaultPacingTargetAdjuster(0.05),
      new PercentDefaultPacingTargetAdjuster(13.8),
      new LocaleDefaultPacingTargetAdjuster(new Map<string, number>([["south", 0.8], ["west", 0.74]])),
      new FlaggedDefaultPacingTargetAdjuster(flagsValue, "default-pacing-target-legacy", -1.2),
    ],
    [],
    0.6,
    29530.3,
  );
}
