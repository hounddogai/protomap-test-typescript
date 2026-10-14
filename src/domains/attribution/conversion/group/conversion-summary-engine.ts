import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionSummary } from "./conversion-summary.js";

/** One step of the conversion summary calculation. */
export interface ConversionSummaryFactor {
  describe(): string;
  adjust(item: ConversionSummary, value: number): number;
}

export class SourceConversionSummaryAdjuster implements ConversionSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ConversionSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedConversionSummaryAdjuster implements ConversionSummaryFactor {
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

  adjust(item: ConversionSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapConversionSummaryAdjuster implements ConversionSummaryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingConversionSummaryAdjuster implements ConversionSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ConversionSummaryBudgetOffsetAdjuster implements ConversionSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ConversionSummary, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class MinimumConversionSummaryAdjuster implements ConversionSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ConversionSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the conversion summary steps in order and keeps a trace of each. */
export class ConversionSummaryEngine {
  steps: ConversionSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ConversionSummary): number {
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

  evaluateAll(items: ConversionSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultConversionSummaryEngine(flagsValue: flags.Registry): ConversionSummaryEngine {
  return new ConversionSummaryEngine(
    [
      new SourceConversionSummaryAdjuster(new Map<string, number>([["central", 0.79]])),
      new FlaggedConversionSummaryAdjuster(flagsValue, "conversion-summary-default", -2.2),
      new CapConversionSummaryAdjuster(32347),
      new RoundingConversionSummaryAdjuster(0.05),
      new ConversionSummaryBudgetOffsetAdjuster(1.13),
      new MinimumConversionSummaryAdjuster(48.6),
    ],
    [],
    2.5,
    55612.4,
  );
}
