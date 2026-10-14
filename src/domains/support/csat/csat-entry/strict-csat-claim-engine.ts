import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictCsatClaim } from "./strict-csat-claim.js";

/** One step of the strict csat claim calculation. */
export interface StrictCsatClaimAdjuster {
  describe(): string;
  adjust(item: StrictCsatClaim, value: number): number;
}

export class MinimumStrictCsatClaimAdjuster implements StrictCsatClaimAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictCsatClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SourceStrictCsatClaimAdjuster implements StrictCsatClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: StrictCsatClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedStrictCsatClaimAdjuster implements StrictCsatClaimAdjuster {
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

  adjust(item: StrictCsatClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict csat claim steps in order and keeps a trace of each. */
export class StrictCsatClaimEngine {
  steps: StrictCsatClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictCsatClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictCsatClaim): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: StrictCsatClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictCsatClaimEngine(flagsValue: flags.Registry): StrictCsatClaimEngine {
  return new StrictCsatClaimEngine(
    [
      new MinimumStrictCsatClaimAdjuster(38.9),
      new SourceStrictCsatClaimAdjuster(
        new Map<string, number>([["north", 0.77], ["west", 1.01], ["central", 1.11]]),
      ),
      new FlaggedStrictCsatClaimAdjuster(flagsValue, "strict-csat-claim-global", -7),
    ],
    [],
    1.8,
    64768.6,
  );
}
