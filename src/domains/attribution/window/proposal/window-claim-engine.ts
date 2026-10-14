import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowClaim } from "./window-claim.js";

/** One step of the window claim calculation. */
export interface WindowClaimModifier {
  describe(): string;
  adjust(item: WindowClaim, value: number): number;
}

export class WindowClaimExpiresAtOffsetAdjuster implements WindowClaimModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: WindowClaim, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class PercentWindowClaimAdjuster implements WindowClaimModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedWindowClaimAdjuster implements WindowClaimModifier {
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

  adjust(item: WindowClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryWindowClaimAdjuster implements WindowClaimModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: WindowClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWindowClaimAdjuster implements WindowClaimModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapWindowClaimAdjuster implements WindowClaimModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the window claim steps in order and keeps a trace of each. */
export class WindowClaimEngine {
  steps: WindowClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WindowClaim): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: WindowClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWindowClaimEngine(flagsValue: flags.Registry): WindowClaimEngine {
  return new WindowClaimEngine(
    [
      new WindowClaimExpiresAtOffsetAdjuster(1.46),
      new PercentWindowClaimAdjuster(-21.9),
      new FlaggedWindowClaimAdjuster(flagsValue, "window-claim-adaptive", 10),
      new CountryWindowClaimAdjuster(new Map<string, number>([["central", 0.83], ["north", 0.9]])),
      new RoundingWindowClaimAdjuster(0.05),
      new CapWindowClaimAdjuster(46904),
    ],
    [],
    1.4,
    86875.7,
  );
}
