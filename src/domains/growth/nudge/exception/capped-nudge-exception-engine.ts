import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedNudgeException } from "./capped-nudge-exception.js";

/** One step of the capped nudge exception calculation. */
export interface CappedNudgeExceptionStep {
  describe(): string;
  adjust(item: CappedNudgeException, value: number): number;
}

export class FlaggedCappedNudgeExceptionAdjuster implements CappedNudgeExceptionStep {
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

  adjust(item: CappedNudgeException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCappedNudgeExceptionAdjuster implements CappedNudgeExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedNudgeException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCappedNudgeExceptionAdjuster implements CappedNudgeExceptionStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedNudgeException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelCappedNudgeExceptionAdjuster implements CappedNudgeExceptionStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CappedNudgeException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumCappedNudgeExceptionAdjuster implements CappedNudgeExceptionStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedNudgeException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapCappedNudgeExceptionAdjuster implements CappedNudgeExceptionStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedNudgeException, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the capped nudge exception steps in order and keeps a trace of each. */
export class CappedNudgeExceptionEngine {
  steps: CappedNudgeExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedNudgeExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedNudgeException): number {
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

  evaluateAll(items: CappedNudgeException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedNudgeExceptionEngine(flagsValue: flags.Registry): CappedNudgeExceptionEngine {
  return new CappedNudgeExceptionEngine(
    [
      new FlaggedCappedNudgeExceptionAdjuster(flagsValue, "capped-nudge-exception-seasonal", -9.1),
      new PercentCappedNudgeExceptionAdjuster(10.4),
      new RoundingCappedNudgeExceptionAdjuster(0.05),
      new LabelCappedNudgeExceptionAdjuster(
        new Map<string, number>([["retail", 1.37], ["south", 1.11], ["west", 0.91]]),
      ),
      new MinimumCappedNudgeExceptionAdjuster(8.2),
      new CapCappedNudgeExceptionAdjuster(22268),
    ],
    [],
    3.5,
    85603,
  );
}
