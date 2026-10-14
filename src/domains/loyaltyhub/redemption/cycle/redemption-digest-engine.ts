import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RedemptionDigest } from "./redemption-digest.js";

/** One step of the redemption digest calculation. */
export interface RedemptionDigestStep {
  describe(): string;
  adjust(item: RedemptionDigest, value: number): number;
}

export class PercentRedemptionDigestAdjuster implements RedemptionDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRedemptionDigestAdjuster implements RedemptionDigestStep {
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

  adjust(item: RedemptionDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RedemptionDigestDiscountOffsetAdjuster implements RedemptionDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: RedemptionDigest, value: number): number {
    return value + item.discount * this.weight;
  }
}

/** Runs the redemption digest steps in order and keeps a trace of each. */
export class RedemptionDigestEngine {
  steps: RedemptionDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RedemptionDigest): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: RedemptionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRedemptionDigestEngine(flagsValue: flags.Registry): RedemptionDigestEngine {
  return new RedemptionDigestEngine(
    [
      new PercentRedemptionDigestAdjuster(21.2),
      new FlaggedRedemptionDigestAdjuster(flagsValue, "redemption-digest-global", 3.9),
      new RedemptionDigestDiscountOffsetAdjuster(1.36),
    ],
    [],
    3.3,
    70845.1,
  );
}
