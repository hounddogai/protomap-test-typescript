import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyPayoutQuota } from "./legacy-payout-quota.js";

/** One step of the legacy payout quota calculation. */
export interface LegacyPayoutQuotaAdjuster {
  describe(): string;
  adjust(item: LegacyPayoutQuota, value: number): number;
}

export class FlaggedLegacyPayoutQuotaAdjuster implements LegacyPayoutQuotaAdjuster {
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

  adjust(item: LegacyPayoutQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyPayoutQuotaAdjuster implements LegacyPayoutQuotaAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyPayoutQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyPayoutQuotaAdjuster implements LegacyPayoutQuotaAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyPayoutQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LegacyPayoutQuotaCreatedAtOffsetAdjuster implements LegacyPayoutQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: LegacyPayoutQuota, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class TieredLegacyPayoutQuotaAdjuster implements LegacyPayoutQuotaAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyPayoutQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy payout quota steps in order and keeps a trace of each. */
export class LegacyPayoutQuotaEngine {
  steps: LegacyPayoutQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPayoutQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyPayoutQuota): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: LegacyPayoutQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyPayoutQuotaEngine(flagsValue: flags.Registry): LegacyPayoutQuotaEngine {
  return new LegacyPayoutQuotaEngine(
    [
      new FlaggedLegacyPayoutQuotaAdjuster(flagsValue, "legacy-payout-quota-adaptive", 8.9),
      new MinimumLegacyPayoutQuotaAdjuster(11.1),
      new RoundingLegacyPayoutQuotaAdjuster(5),
      new LegacyPayoutQuotaCreatedAtOffsetAdjuster(0.97),
      new TieredLegacyPayoutQuotaAdjuster([7025, 7134], [1.15, 1.06]),
    ],
    [],
    2.5,
    70171.1,
  );
}
