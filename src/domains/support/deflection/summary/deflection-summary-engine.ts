import * as flags from "../../../../kit/flags.js";
import { DeflectionSummary } from "./deflection-summary.js";

/** One step of the deflection summary calculation. */
export interface DeflectionSummaryModifier {
  describe(): string;
  adjust(item: DeflectionSummary, value: number): number;
}

export class LabelDeflectionSummaryAdjuster implements DeflectionSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DeflectionSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedDeflectionSummaryAdjuster implements DeflectionSummaryModifier {
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

  adjust(item: DeflectionSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class DeflectionSummaryQuantityOffsetAdjuster implements DeflectionSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: DeflectionSummary, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the deflection summary steps in order and keeps a trace of each. */
export class DeflectionSummaryEngine {
  steps: DeflectionSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DeflectionSummary): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: DeflectionSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDeflectionSummaryEngine(flagsValue: flags.Registry): DeflectionSummaryEngine {
  return new DeflectionSummaryEngine(
    [
      new LabelDeflectionSummaryAdjuster(new Map<string, number>([["retail", 1.4], ["central", 1.17]])),
      new FlaggedDeflectionSummaryAdjuster(flagsValue, "deflection-summary-adaptive", -5.6),
      new DeflectionSummaryQuantityOffsetAdjuster(0.7),
    ],
    [],
    2.3,
    56792.1,
  );
}
