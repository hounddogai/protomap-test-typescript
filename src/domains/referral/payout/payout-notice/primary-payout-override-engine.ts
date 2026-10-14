import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryPayoutOverride } from "./primary-payout-override.js";

/** One step of the primary payout override calculation. */
export interface PrimaryPayoutOverrideFactor {
  describe(): string;
  adjust(item: PrimaryPayoutOverride, value: number): number;
}

export class CapPrimaryPayoutOverrideAdjuster implements PrimaryPayoutOverrideFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryPayoutOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPrimaryPayoutOverrideAdjuster implements PrimaryPayoutOverrideFactor {
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

  adjust(item: PrimaryPayoutOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelPrimaryPayoutOverrideAdjuster implements PrimaryPayoutOverrideFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PrimaryPayoutOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary payout override steps in order and keeps a trace of each. */
export class PrimaryPayoutOverrideEngine {
  steps: PrimaryPayoutOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPayoutOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryPayoutOverride): number {
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

  evaluateAll(items: PrimaryPayoutOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryPayoutOverrideEngine(flagsValue: flags.Registry): PrimaryPayoutOverrideEngine {
  return new PrimaryPayoutOverrideEngine(
    [
      new CapPrimaryPayoutOverrideAdjuster(7991),
      new FlaggedPrimaryPayoutOverrideAdjuster(flagsValue, "primary-payout-override-lenient", 6.8),
      new LabelPrimaryPayoutOverrideAdjuster(new Map<string, number>([["west", 0.71]])),
    ],
    [],
    0.9,
    63616.4,
  );
}
