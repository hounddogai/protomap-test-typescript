import * as numbers from "../../../../kit/numbers.js";
import { CsatProfile } from "./csat-profile.js";

/** One step of the csat profile calculation. */
export interface CsatProfileModifier {
  describe(): string;
  adjust(item: CsatProfile, value: number): number;
}

export class MinimumCsatProfileAdjuster implements CsatProfileModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CsatProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleCsatProfileAdjuster implements CsatProfileModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: CsatProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCsatProfileAdjuster implements CsatProfileModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the csat profile steps in order and keeps a trace of each. */
export class CsatProfileEngine {
  steps: CsatProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CsatProfile): number {
    let current = item.weightedValue();
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

  evaluateAll(items: CsatProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCsatProfileEngine(): CsatProfileEngine {
  return new CsatProfileEngine(
    [
      new MinimumCsatProfileAdjuster(28.8),
      new TitleCsatProfileAdjuster(new Map<string, number>([["west", 0.73], ["north", 0.75]])),
      new PercentCsatProfileAdjuster(14.1),
    ],
    [],
    3.9,
    76408.5,
  );
}
