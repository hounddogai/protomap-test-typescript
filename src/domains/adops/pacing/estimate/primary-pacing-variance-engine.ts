import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryPacingVariance } from "./primary-pacing-variance.js";

/** One step of the primary pacing variance calculation. */
export interface PrimaryPacingVarianceModifier {
  describe(): string;
  adjust(item: PrimaryPacingVariance, value: number): number;
}

export class FlaggedPrimaryPacingVarianceAdjuster implements PrimaryPacingVarianceModifier {
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

  adjust(item: PrimaryPacingVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPrimaryPacingVarianceAdjuster implements PrimaryPacingVarianceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryPacingVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryPacingVarianceAdjuster implements PrimaryPacingVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryPacingVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary pacing variance steps in order and keeps a trace of each. */
export class PrimaryPacingVarianceEngine {
  steps: PrimaryPacingVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPacingVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryPacingVariance): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PrimaryPacingVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryPacingVarianceEngine(flagsValue: flags.Registry): PrimaryPacingVarianceEngine {
  return new PrimaryPacingVarianceEngine(
    [
      new FlaggedPrimaryPacingVarianceAdjuster(flagsValue, "primary-pacing-variance-scheduled", 9.6),
      new PercentPrimaryPacingVarianceAdjuster(17.2),
      new RoundingPrimaryPacingVarianceAdjuster(1),
    ],
    [],
    4.2,
    63271.3,
  );
}
