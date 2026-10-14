import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredEnrollmentProfile } from "./tiered-enrollment-profile.js";

/** One step of the tiered enrollment profile calculation. */
export interface TieredEnrollmentProfileStep {
  describe(): string;
  adjust(item: TieredEnrollmentProfile, value: number): number;
}

export class RoundingTieredEnrollmentProfileAdjuster implements TieredEnrollmentProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredEnrollmentProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredEnrollmentProfileOpenRateOffsetAdjuster implements TieredEnrollmentProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: TieredEnrollmentProfile, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class FlaggedTieredEnrollmentProfileAdjuster implements TieredEnrollmentProfileStep {
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

  adjust(item: TieredEnrollmentProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelTieredEnrollmentProfileAdjuster implements TieredEnrollmentProfileStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredEnrollmentProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredEnrollmentProfileAdjuster implements TieredEnrollmentProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredEnrollmentProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered enrollment profile steps in order and keeps a trace of each. */
export class TieredEnrollmentProfileEngine {
  steps: TieredEnrollmentProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredEnrollmentProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredEnrollmentProfile): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: TieredEnrollmentProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredEnrollmentProfileEngine(flagsValue: flags.Registry): TieredEnrollmentProfileEngine {
  return new TieredEnrollmentProfileEngine(
    [
      new RoundingTieredEnrollmentProfileAdjuster(0.05),
      new TieredEnrollmentProfileOpenRateOffsetAdjuster(1.71),
      new FlaggedTieredEnrollmentProfileAdjuster(flagsValue, "tiered-enrollment-profile-strict", -5.6),
      new LabelTieredEnrollmentProfileAdjuster(new Map<string, number>([["central", 1.04], ["retail", 0.86]])),
      new CapTieredEnrollmentProfileAdjuster(2835),
    ],
    [],
    2.5,
    2248.2,
  );
}
