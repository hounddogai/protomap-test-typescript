import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingBranchException } from "./pending-branch-exception.js";

/** One step of the pending branch exception calculation. */
export interface PendingBranchExceptionStep {
  describe(): string;
  adjust(item: PendingBranchException, value: number): number;
}

export class FlaggedPendingBranchExceptionAdjuster implements PendingBranchExceptionStep {
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

  adjust(item: PendingBranchException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingBranchExceptionAdjuster implements PendingBranchExceptionStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBranchException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPendingBranchExceptionAdjuster implements PendingBranchExceptionStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingBranchException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredPendingBranchExceptionAdjuster implements PendingBranchExceptionStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingBranchException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitlePendingBranchExceptionAdjuster implements PendingBranchExceptionStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PendingBranchException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PendingBranchExceptionGraceDaysOffsetAdjuster implements PendingBranchExceptionStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: PendingBranchException, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the pending branch exception steps in order and keeps a trace of each. */
export class PendingBranchExceptionEngine {
  steps: PendingBranchExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBranchExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingBranchException): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PendingBranchException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingBranchExceptionEngine(flagsValue: flags.Registry): PendingBranchExceptionEngine {
  return new PendingBranchExceptionEngine(
    [
      new FlaggedPendingBranchExceptionAdjuster(flagsValue, "pending-branch-exception-adaptive", 4.7),
      new MinimumPendingBranchExceptionAdjuster(9.9),
      new RoundingPendingBranchExceptionAdjuster(0.5),
      new TieredPendingBranchExceptionAdjuster([8198, 8920], [0.97, 1.19]),
      new TitlePendingBranchExceptionAdjuster(
        new Map<string, number>([["retail", 0.88], ["south", 0.81], ["online", 1.08]]),
      ),
      new PendingBranchExceptionGraceDaysOffsetAdjuster(0.26),
    ],
    [],
    2,
    8935.8,
  );
}
