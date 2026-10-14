import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictApprovalScore } from "./strict-approval-score.js";

/** One step of the strict approval score calculation. */
export interface StrictApprovalScoreStep {
  describe(): string;
  adjust(item: StrictApprovalScore, value: number): number;
}

export class LabelStrictApprovalScoreAdjuster implements StrictApprovalScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: StrictApprovalScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentStrictApprovalScoreAdjuster implements StrictApprovalScoreStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictApprovalScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedStrictApprovalScoreAdjuster implements StrictApprovalScoreStep {
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

  adjust(item: StrictApprovalScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredStrictApprovalScoreAdjuster implements StrictApprovalScoreStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictApprovalScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict approval score steps in order and keeps a trace of each. */
export class StrictApprovalScoreEngine {
  steps: StrictApprovalScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictApprovalScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictApprovalScore): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: StrictApprovalScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictApprovalScoreEngine(flagsValue: flags.Registry): StrictApprovalScoreEngine {
  return new StrictApprovalScoreEngine(
    [
      new LabelStrictApprovalScoreAdjuster(new Map<string, number>([["east", 0.85], ["online", 1.33]])),
      new PercentStrictApprovalScoreAdjuster(3),
      new FlaggedStrictApprovalScoreAdjuster(flagsValue, "strict-approval-score-regional", -0.2),
      new TieredStrictApprovalScoreAdjuster([3828, 4954, 5817, 9004], [1.16, 0.81, 0.8, 1.09]),
    ],
    [],
    2.9,
    11307,
  );
}
