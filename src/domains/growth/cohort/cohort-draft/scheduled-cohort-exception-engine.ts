import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledCohortException } from "./scheduled-cohort-exception.js";

/** One step of the scheduled cohort exception calculation. */
export interface ScheduledCohortExceptionModifier {
  describe(): string;
  adjust(item: ScheduledCohortException, value: number): number;
}

export class FlaggedScheduledCohortExceptionAdjuster implements ScheduledCohortExceptionModifier {
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

  adjust(item: ScheduledCohortException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelScheduledCohortExceptionAdjuster implements ScheduledCohortExceptionModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ScheduledCohortException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingScheduledCohortExceptionAdjuster implements ScheduledCohortExceptionModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledCohortException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapScheduledCohortExceptionAdjuster implements ScheduledCohortExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledCohortException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumScheduledCohortExceptionAdjuster implements ScheduledCohortExceptionModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledCohortException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled cohort exception steps in order and keeps a trace of each. */
export class ScheduledCohortExceptionEngine {
  steps: ScheduledCohortExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledCohortExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledCohortException): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ScheduledCohortException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledCohortExceptionEngine(flagsValue: flags.Registry): ScheduledCohortExceptionEngine {
  return new ScheduledCohortExceptionEngine(
    [
      new FlaggedScheduledCohortExceptionAdjuster(flagsValue, "scheduled-cohort-exception-scheduled", -2.3),
      new ChannelScheduledCohortExceptionAdjuster(new Map<string, number>([["online", 1.27], ["west", 1.13]])),
      new RoundingScheduledCohortExceptionAdjuster(5),
      new CapScheduledCohortExceptionAdjuster(2536),
      new MinimumScheduledCohortExceptionAdjuster(46.1),
    ],
    [],
    4.7,
    22045.4,
  );
}
