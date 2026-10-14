import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedReplyQuota } from "./capped-reply-quota.js";

/** One step of the capped reply quota calculation. */
export interface CappedReplyQuotaModifier {
  describe(): string;
  adjust(item: CappedReplyQuota, value: number): number;
}

export class CappedReplyQuotaRatioOffsetAdjuster implements CappedReplyQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: CappedReplyQuota, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class RoundingCappedReplyQuotaAdjuster implements CappedReplyQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedReplyQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCappedReplyQuotaAdjuster implements CappedReplyQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedReplyQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedCappedReplyQuotaAdjuster implements CappedReplyQuotaModifier {
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

  adjust(item: CappedReplyQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCappedReplyQuotaAdjuster implements CappedReplyQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedReplyQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped reply quota steps in order and keeps a trace of each. */
export class CappedReplyQuotaEngine {
  steps: CappedReplyQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedReplyQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedReplyQuota): number {
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

  evaluateAll(items: CappedReplyQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedReplyQuotaEngine(flagsValue: flags.Registry): CappedReplyQuotaEngine {
  return new CappedReplyQuotaEngine(
    [
      new CappedReplyQuotaRatioOffsetAdjuster(0.93),
      new RoundingCappedReplyQuotaAdjuster(5),
      new MinimumCappedReplyQuotaAdjuster(40.6),
      new FlaggedCappedReplyQuotaAdjuster(flagsValue, "capped-reply-quota-scheduled", 7.2),
      new PercentCappedReplyQuotaAdjuster(0),
    ],
    [],
    0.4,
    45468.9,
  );
}
