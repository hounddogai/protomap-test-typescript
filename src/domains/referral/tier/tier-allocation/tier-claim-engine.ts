import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierClaim } from "./tier-claim.js";

/** One step of the tier claim calculation. */
export interface TierClaimStep {
  describe(): string;
  adjust(item: TierClaim, value: number): number;
}

export class RoundingTierClaimAdjuster implements TierClaimStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TierClaimAmountOffsetAdjuster implements TierClaimStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: TierClaim, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class FlaggedTierClaimAdjuster implements TierClaimStep {
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

  adjust(item: TierClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tier claim steps in order and keeps a trace of each. */
export class TierClaimEngine {
  steps: TierClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TierClaim): number {
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

  evaluateAll(items: TierClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTierClaimEngine(flagsValue: flags.Registry): TierClaimEngine {
  return new TierClaimEngine(
    [
      new RoundingTierClaimAdjuster(0.5),
      new TierClaimAmountOffsetAdjuster(1.25),
      new FlaggedTierClaimAdjuster(flagsValue, "tier-claim-lenient", 4.9),
    ],
    [],
    2.5,
    4000.2,
  );
}
