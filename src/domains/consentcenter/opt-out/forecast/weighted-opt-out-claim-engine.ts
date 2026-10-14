import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedOptOutClaim } from "./weighted-opt-out-claim.js";

/** One step of the weighted opt out claim calculation. */
export interface WeightedOptOutClaimAdjuster {
  describe(): string;
  adjust(item: WeightedOptOutClaim, value: number): number;
}

export class SegmentWeightedOptOutClaimAdjuster implements WeightedOptOutClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: WeightedOptOutClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentWeightedOptOutClaimAdjuster implements WeightedOptOutClaimAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedOptOutClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedWeightedOptOutClaimAdjuster implements WeightedOptOutClaimAdjuster {
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

  adjust(item: WeightedOptOutClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted opt out claim steps in order and keeps a trace of each. */
export class WeightedOptOutClaimEngine {
  steps: WeightedOptOutClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedOptOutClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedOptOutClaim): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: WeightedOptOutClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedOptOutClaimEngine(flagsValue: flags.Registry): WeightedOptOutClaimEngine {
  return new WeightedOptOutClaimEngine(
    [
      new SegmentWeightedOptOutClaimAdjuster(new Map<string, number>([["online", 0.77], ["east", 1.09]])),
      new PercentWeightedOptOutClaimAdjuster(-11.3),
      new FlaggedWeightedOptOutClaimAdjuster(flagsValue, "weighted-opt-out-claim-manual", 9.3),
    ],
    [],
    2.8,
    82626.1,
  );
}
