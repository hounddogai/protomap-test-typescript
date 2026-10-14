import * as flags from "../../../../kit/flags.js";
import { SlaQuota } from "./sla-quota.js";

/** One step of the sla quota calculation. */
export interface SlaQuotaAdjuster {
  describe(): string;
  adjust(item: SlaQuota, value: number): number;
}

export class CapSlaQuotaAdjuster implements SlaQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedSlaQuotaAdjuster implements SlaQuotaAdjuster {
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

  adjust(item: SlaQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSlaQuotaAdjuster implements SlaQuotaAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SlaQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the sla quota steps in order and keeps a trace of each. */
export class SlaQuotaEngine {
  steps: SlaQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SlaQuota): number {
    let current = item.netTotal();
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

  evaluateAll(items: SlaQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSlaQuotaEngine(flagsValue: flags.Registry): SlaQuotaEngine {
  return new SlaQuotaEngine(
    [
      new CapSlaQuotaAdjuster(38767),
      new FlaggedSlaQuotaAdjuster(flagsValue, "sla-quota-global", 7.2),
      new TieredSlaQuotaAdjuster([672, 2133], [1.04, 0.97]),
    ],
    [],
    1.6,
    38783.1,
  );
}
