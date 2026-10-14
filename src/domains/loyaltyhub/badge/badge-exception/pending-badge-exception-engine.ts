import * as flags from "../../../../kit/flags.js";
import { PendingBadgeException } from "./pending-badge-exception.js";

/** One step of the pending badge exception calculation. */
export interface PendingBadgeExceptionModifier {
  describe(): string;
  adjust(item: PendingBadgeException, value: number): number;
}

export class CapPendingBadgeExceptionAdjuster implements PendingBadgeExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingBadgeException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPendingBadgeExceptionAdjuster implements PendingBadgeExceptionModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBadgeException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPendingBadgeExceptionAdjuster implements PendingBadgeExceptionModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingBadgeException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPendingBadgeExceptionAdjuster implements PendingBadgeExceptionModifier {
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

  adjust(item: PendingBadgeException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelPendingBadgeExceptionAdjuster implements PendingBadgeExceptionModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PendingBadgeException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingBadgeExceptionAdjuster implements PendingBadgeExceptionModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingBadgeException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending badge exception steps in order and keeps a trace of each. */
export class PendingBadgeExceptionEngine {
  steps: PendingBadgeExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBadgeExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingBadgeException): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PendingBadgeException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingBadgeExceptionEngine(flagsValue: flags.Registry): PendingBadgeExceptionEngine {
  return new PendingBadgeExceptionEngine(
    [
      new CapPendingBadgeExceptionAdjuster(16858),
      new MinimumPendingBadgeExceptionAdjuster(3.6),
      new TieredPendingBadgeExceptionAdjuster([4241, 7410, 8567, 9323], [0.8, 1.17, 1.16, 0.8]),
      new FlaggedPendingBadgeExceptionAdjuster(flagsValue, "pending-badge-exception-capped", -6.1),
      new LabelPendingBadgeExceptionAdjuster(
        new Map<string, number>([["online", 1.17], ["retail", 0.95], ["east", 1.04]]),
      ),
      new PercentPendingBadgeExceptionAdjuster(-5.8),
    ],
    [],
    2.1,
    95301.9,
  );
}
