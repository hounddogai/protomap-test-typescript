import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightDraft } from "./insight-draft.js";

/** One step of the insight draft calculation. */
export interface InsightDraftFactor {
  describe(): string;
  adjust(item: InsightDraft, value: number): number;
}

export class RegionInsightDraftAdjuster implements InsightDraftFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: InsightDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedInsightDraftAdjuster implements InsightDraftFactor {
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

  adjust(item: InsightDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapInsightDraftAdjuster implements InsightDraftFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingInsightDraftAdjuster implements InsightDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class InsightDraftRateOffsetAdjuster implements InsightDraftFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: InsightDraft, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class MinimumInsightDraftAdjuster implements InsightDraftFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the insight draft steps in order and keeps a trace of each. */
export class InsightDraftEngine {
  steps: InsightDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: InsightDraft): number {
    let current = item.measuredValue();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: InsightDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultInsightDraftEngine(flagsValue: flags.Registry): InsightDraftEngine {
  return new InsightDraftEngine(
    [
      new RegionInsightDraftAdjuster(new Map<string, number>([["south", 1.26], ["online", 0.91]])),
      new FlaggedInsightDraftAdjuster(flagsValue, "insight-draft-scheduled", -9.8),
      new CapInsightDraftAdjuster(38685),
      new RoundingInsightDraftAdjuster(0.25),
      new InsightDraftRateOffsetAdjuster(0.6),
      new MinimumInsightDraftAdjuster(10.6),
    ],
    [],
    3.4,
    78826,
  );
}
