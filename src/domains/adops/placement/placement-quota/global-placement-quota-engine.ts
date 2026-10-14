import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalPlacementQuota } from "./global-placement-quota.js";

/** One step of the global placement quota calculation. */
export interface GlobalPlacementQuotaStep {
  describe(): string;
  adjust(item: GlobalPlacementQuota, value: number): number;
}

export class CapGlobalPlacementQuotaAdjuster implements GlobalPlacementQuotaStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalPlacementQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedGlobalPlacementQuotaAdjuster implements GlobalPlacementQuotaStep {
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

  adjust(item: GlobalPlacementQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalPlacementQuotaAdjuster implements GlobalPlacementQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalPlacementQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredGlobalPlacementQuotaAdjuster implements GlobalPlacementQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalPlacementQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global placement quota steps in order and keeps a trace of each. */
export class GlobalPlacementQuotaEngine {
  steps: GlobalPlacementQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalPlacementQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalPlacementQuota): number {
    let current = item.netValue();
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

  evaluateAll(items: GlobalPlacementQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalPlacementQuotaEngine(flagsValue: flags.Registry): GlobalPlacementQuotaEngine {
  return new GlobalPlacementQuotaEngine(
    [
      new CapGlobalPlacementQuotaAdjuster(25433),
      new FlaggedGlobalPlacementQuotaAdjuster(flagsValue, "global-placement-quota-tiered", 2.1),
      new RoundingGlobalPlacementQuotaAdjuster(0.5),
      new TieredGlobalPlacementQuotaAdjuster([3793, 4971, 5126, 9510], [1.15, 1.06, 1.06, 0.93]),
    ],
    [],
    2.1,
    55826.1,
  );
}
