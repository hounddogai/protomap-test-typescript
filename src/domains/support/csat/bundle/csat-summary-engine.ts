import * as flags from "../../../../kit/flags.js";
import { CsatSummary } from "./csat-summary.js";

/** One step of the csat summary calculation. */
export interface CsatSummaryModifier {
  describe(): string;
  adjust(item: CsatSummary, value: number): number;
}

export class FlaggedCsatSummaryAdjuster implements CsatSummaryModifier {
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

  adjust(item: CsatSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelCsatSummaryAdjuster implements CsatSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CsatSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CsatSummaryPriorityOffsetAdjuster implements CsatSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: CsatSummary, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class TieredCsatSummaryAdjuster implements CsatSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCsatSummaryAdjuster implements CsatSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCsatSummaryAdjuster implements CsatSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CsatSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the csat summary steps in order and keeps a trace of each. */
export class CsatSummaryEngine {
  steps: CsatSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CsatSummary): number {
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

  evaluateAll(items: CsatSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCsatSummaryEngine(flagsValue: flags.Registry): CsatSummaryEngine {
  return new CsatSummaryEngine(
    [
      new FlaggedCsatSummaryAdjuster(flagsValue, "csat-summary-strict", -1.4),
      new LabelCsatSummaryAdjuster(
        new Map<string, number>([["north", 0.93], ["central", 1.35], ["online", 1.06]]),
      ),
      new CsatSummaryPriorityOffsetAdjuster(1.81),
      new TieredCsatSummaryAdjuster([558, 683, 6562], [1.2, 0.8, 0.91]),
      new PercentCsatSummaryAdjuster(-14.4),
      new MinimumCsatSummaryAdjuster(21.9),
    ],
    [],
    0.5,
    5388.4,
  );
}
