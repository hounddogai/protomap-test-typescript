import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalFraudCheckClaim } from "./global-fraud-check-claim.js";

/** One step of the global fraud check claim calculation. */
export interface GlobalFraudCheckClaimModifier {
  describe(): string;
  adjust(item: GlobalFraudCheckClaim, value: number): number;
}

export class MinimumGlobalFraudCheckClaimAdjuster implements GlobalFraudCheckClaimModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalFraudCheckClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedGlobalFraudCheckClaimAdjuster implements GlobalFraudCheckClaimModifier {
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

  adjust(item: GlobalFraudCheckClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalFraudCheckClaimAdjuster implements GlobalFraudCheckClaimModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalFraudCheckClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global fraud check claim steps in order and keeps a trace of each. */
export class GlobalFraudCheckClaimEngine {
  steps: GlobalFraudCheckClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalFraudCheckClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalFraudCheckClaim): number {
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

  evaluateAll(items: GlobalFraudCheckClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalFraudCheckClaimEngine(flagsValue: flags.Registry): GlobalFraudCheckClaimEngine {
  return new GlobalFraudCheckClaimEngine(
    [
      new MinimumGlobalFraudCheckClaimAdjuster(27.1),
      new FlaggedGlobalFraudCheckClaimAdjuster(flagsValue, "global-fraud-check-claim-rolling", 4.1),
      new TieredGlobalFraudCheckClaimAdjuster([4436, 6881, 9255, 9705], [1.01, 1.14, 1.02, 1.16]),
    ],
    [],
    0.7,
    19450.4,
  );
}
