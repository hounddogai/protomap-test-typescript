import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientPostClaim } from "./lenient-post-claim.js";

/** One step of the lenient post claim calculation. */
export interface LenientPostClaimStep {
  describe(): string;
  adjust(item: LenientPostClaim, value: number): number;
}

export class CapLenientPostClaimAdjuster implements LenientPostClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientPostClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLenientPostClaimAdjuster implements LenientPostClaimStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientPostClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLenientPostClaimAdjuster implements LenientPostClaimStep {
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

  adjust(item: LenientPostClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient post claim steps in order and keeps a trace of each. */
export class LenientPostClaimEngine {
  steps: LenientPostClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPostClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientPostClaim): number {
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

  evaluateAll(items: LenientPostClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientPostClaimEngine(flagsValue: flags.Registry): LenientPostClaimEngine {
  return new LenientPostClaimEngine(
    [
      new CapLenientPostClaimAdjuster(49388),
      new TieredLenientPostClaimAdjuster([6638, 7588], [1.05, 1.06]),
      new FlaggedLenientPostClaimAdjuster(flagsValue, "lenient-post-claim-default", -1.7),
    ],
    [],
    4,
    64154.6,
  );
}
