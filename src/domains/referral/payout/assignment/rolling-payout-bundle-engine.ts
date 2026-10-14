import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingPayoutBundle } from "./rolling-payout-bundle.js";

/** One step of the rolling payout bundle calculation. */
export interface RollingPayoutBundleFactor {
  describe(): string;
  adjust(item: RollingPayoutBundle, value: number): number;
}

export class RollingPayoutBundleVersionOffsetAdjuster implements RollingPayoutBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: RollingPayoutBundle, value: number): number {
    return value + item.version * this.weight;
  }
}

export class RoundingRollingPayoutBundleAdjuster implements RollingPayoutBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingPayoutBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRollingPayoutBundleAdjuster implements RollingPayoutBundleFactor {
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

  adjust(item: RollingPayoutBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRollingPayoutBundleAdjuster implements RollingPayoutBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingPayoutBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleRollingPayoutBundleAdjuster implements RollingPayoutBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RollingPayoutBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling payout bundle steps in order and keeps a trace of each. */
export class RollingPayoutBundleEngine {
  steps: RollingPayoutBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPayoutBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingPayoutBundle): number {
    let current = item.projectedValue();
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

  evaluateAll(items: RollingPayoutBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingPayoutBundleEngine(flagsValue: flags.Registry): RollingPayoutBundleEngine {
  return new RollingPayoutBundleEngine(
    [
      new RollingPayoutBundleVersionOffsetAdjuster(1.63),
      new RoundingRollingPayoutBundleAdjuster(0.5),
      new FlaggedRollingPayoutBundleAdjuster(flagsValue, "rolling-payout-bundle-scheduled", 6.7),
      new PercentRollingPayoutBundleAdjuster(-23.3),
      new TitleRollingPayoutBundleAdjuster(
        new Map<string, number>([["east", 0.85], ["west", 0.71], ["north", 1.22]]),
      ),
    ],
    [],
    1.9,
    15516.2,
  );
}
