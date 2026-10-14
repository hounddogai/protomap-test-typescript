import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientCreditSummary } from "./lenient-credit-summary.js";

/** One step of the lenient credit summary calculation. */
export interface LenientCreditSummaryModifier {
  describe(): string;
  adjust(item: LenientCreditSummary, value: number): number;
}

export class CapLenientCreditSummaryAdjuster implements LenientCreditSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientCreditSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentLenientCreditSummaryAdjuster implements LenientCreditSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientCreditSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientCreditSummaryAdjuster implements LenientCreditSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientCreditSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LenientCreditSummaryRevisionOffsetAdjuster implements LenientCreditSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: LenientCreditSummary, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class FlaggedLenientCreditSummaryAdjuster implements LenientCreditSummaryModifier {
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

  adjust(item: LenientCreditSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient credit summary steps in order and keeps a trace of each. */
export class LenientCreditSummaryEngine {
  steps: LenientCreditSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientCreditSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientCreditSummary): number {
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

  evaluateAll(items: LenientCreditSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientCreditSummaryEngine(flagsValue: flags.Registry): LenientCreditSummaryEngine {
  return new LenientCreditSummaryEngine(
    [
      new CapLenientCreditSummaryAdjuster(41944),
      new PercentLenientCreditSummaryAdjuster(-12.6),
      new RoundingLenientCreditSummaryAdjuster(0.1),
      new LenientCreditSummaryRevisionOffsetAdjuster(1.03),
      new FlaggedLenientCreditSummaryAdjuster(flagsValue, "lenient-credit-summary-capped", -0.7),
    ],
    [],
    2.5,
    8257.3,
  );
}
