import * as flags from "../../../../kit/flags.js";
import { PrimaryJourneySummary } from "./primary-journey-summary.js";

/** One step of the primary journey summary calculation. */
export interface PrimaryJourneySummaryModifier {
  describe(): string;
  adjust(item: PrimaryJourneySummary, value: number): number;
}

export class CapPrimaryJourneySummaryAdjuster implements PrimaryJourneySummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryJourneySummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelPrimaryJourneySummaryAdjuster implements PrimaryJourneySummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PrimaryJourneySummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPrimaryJourneySummaryAdjuster implements PrimaryJourneySummaryModifier {
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

  adjust(item: PrimaryJourneySummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary journey summary steps in order and keeps a trace of each. */
export class PrimaryJourneySummaryEngine {
  steps: PrimaryJourneySummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryJourneySummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryJourneySummary): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: PrimaryJourneySummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryJourneySummaryEngine(flagsValue: flags.Registry): PrimaryJourneySummaryEngine {
  return new PrimaryJourneySummaryEngine(
    [
      new CapPrimaryJourneySummaryAdjuster(23177),
      new LabelPrimaryJourneySummaryAdjuster(new Map<string, number>([["west", 1.19]])),
      new FlaggedPrimaryJourneySummaryAdjuster(flagsValue, "primary-journey-summary-tiered", -1.6),
    ],
    [],
    4.6,
    43878.9,
  );
}
