import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationException } from "./reputation-exception.js";

/** One step of the reputation exception calculation. */
export interface ReputationExceptionStep {
  describe(): string;
  adjust(item: ReputationException, value: number): number;
}

export class FlaggedReputationExceptionAdjuster implements ReputationExceptionStep {
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

  adjust(item: ReputationException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelReputationExceptionAdjuster implements ReputationExceptionStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ReputationException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapReputationExceptionAdjuster implements ReputationExceptionStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentReputationExceptionAdjuster implements ReputationExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingReputationExceptionAdjuster implements ReputationExceptionStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the reputation exception steps in order and keeps a trace of each. */
export class ReputationExceptionEngine {
  steps: ReputationExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReputationException): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ReputationException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReputationExceptionEngine(flagsValue: flags.Registry): ReputationExceptionEngine {
  return new ReputationExceptionEngine(
    [
      new FlaggedReputationExceptionAdjuster(flagsValue, "reputation-exception-regional", -6.9),
      new LabelReputationExceptionAdjuster(new Map<string, number>([["north", 0.71]])),
      new CapReputationExceptionAdjuster(3971),
      new PercentReputationExceptionAdjuster(-11.5),
      new RoundingReputationExceptionAdjuster(0.05),
    ],
    [],
    0.1,
    94453.2,
  );
}
