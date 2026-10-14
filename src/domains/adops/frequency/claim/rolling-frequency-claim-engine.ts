import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingFrequencyClaim } from "./rolling-frequency-claim.js";

/** One step of the rolling frequency claim calculation. */
export interface RollingFrequencyClaimAdjuster {
  describe(): string;
  adjust(item: RollingFrequencyClaim, value: number): number;
}

export class MinimumRollingFrequencyClaimAdjuster implements RollingFrequencyClaimAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingFrequencyClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRollingFrequencyClaimAdjuster implements RollingFrequencyClaimAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingFrequencyClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRollingFrequencyClaimAdjuster implements RollingFrequencyClaimAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingFrequencyClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRollingFrequencyClaimAdjuster implements RollingFrequencyClaimAdjuster {
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

  adjust(item: RollingFrequencyClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RollingFrequencyClaimLimitOffsetAdjuster implements RollingFrequencyClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: RollingFrequencyClaim, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class NameRollingFrequencyClaimAdjuster implements RollingFrequencyClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RollingFrequencyClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling frequency claim steps in order and keeps a trace of each. */
export class RollingFrequencyClaimEngine {
  steps: RollingFrequencyClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingFrequencyClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingFrequencyClaim): number {
    let current = item.netTotal();
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

  evaluateAll(items: RollingFrequencyClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingFrequencyClaimEngine(flagsValue: flags.Registry): RollingFrequencyClaimEngine {
  return new RollingFrequencyClaimEngine(
    [
      new MinimumRollingFrequencyClaimAdjuster(39.6),
      new CapRollingFrequencyClaimAdjuster(10594),
      new RoundingRollingFrequencyClaimAdjuster(0.05),
      new FlaggedRollingFrequencyClaimAdjuster(flagsValue, "rolling-frequency-claim-manual", -1.3),
      new RollingFrequencyClaimLimitOffsetAdjuster(0.91),
      new NameRollingFrequencyClaimAdjuster(new Map<string, number>([["online", 0.76], ["central", 0.97]])),
    ],
    [],
    2.2,
    46531.1,
  );
}
