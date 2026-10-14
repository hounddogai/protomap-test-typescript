import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyProofClaim } from "./legacy-proof-claim.js";

/** One step of the legacy proof claim calculation. */
export interface LegacyProofClaimAdjuster {
  describe(): string;
  adjust(item: LegacyProofClaim, value: number): number;
}

export class FlaggedLegacyProofClaimAdjuster implements LegacyProofClaimAdjuster {
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

  adjust(item: LegacyProofClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameLegacyProofClaimAdjuster implements LegacyProofClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LegacyProofClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLegacyProofClaimAdjuster implements LegacyProofClaimAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyProofClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy proof claim steps in order and keeps a trace of each. */
export class LegacyProofClaimEngine {
  steps: LegacyProofClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyProofClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyProofClaim): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LegacyProofClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyProofClaimEngine(flagsValue: flags.Registry): LegacyProofClaimEngine {
  return new LegacyProofClaimEngine(
    [
      new FlaggedLegacyProofClaimAdjuster(flagsValue, "legacy-proof-claim-pending", -6),
      new NameLegacyProofClaimAdjuster(new Map<string, number>([["north", 1.36]])),
      new RoundingLegacyProofClaimAdjuster(5),
    ],
    [],
    4.6,
    8454.3,
  );
}
