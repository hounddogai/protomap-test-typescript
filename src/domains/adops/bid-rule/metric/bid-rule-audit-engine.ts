import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BidRuleAudit } from "./bid-rule-audit.js";

/** One step of the bid rule audit calculation. */
export interface BidRuleAuditAdjuster {
  describe(): string;
  adjust(item: BidRuleAudit, value: number): number;
}

export class FlaggedBidRuleAuditAdjuster implements BidRuleAuditAdjuster {
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

  adjust(item: BidRuleAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionBidRuleAuditAdjuster implements BidRuleAuditAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: BidRuleAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBidRuleAuditAdjuster implements BidRuleAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BidRuleAuditExpiresAtOffsetAdjuster implements BidRuleAuditAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: BidRuleAudit, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class MinimumBidRuleAuditAdjuster implements BidRuleAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBidRuleAuditAdjuster implements BidRuleAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the bid rule audit steps in order and keeps a trace of each. */
export class BidRuleAuditEngine {
  steps: BidRuleAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BidRuleAudit): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: BidRuleAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBidRuleAuditEngine(flagsValue: flags.Registry): BidRuleAuditEngine {
  return new BidRuleAuditEngine(
    [
      new FlaggedBidRuleAuditAdjuster(flagsValue, "bid-rule-audit-legacy", -8.9),
      new RegionBidRuleAuditAdjuster(new Map<string, number>([["north", 1.11], ["central", 0.98]])),
      new PercentBidRuleAuditAdjuster(14.4),
      new BidRuleAuditExpiresAtOffsetAdjuster(1.9),
      new MinimumBidRuleAuditAdjuster(20.5),
      new TieredBidRuleAuditAdjuster([1405, 5824, 8030], [1.02, 0.83, 0.97]),
    ],
    [],
    1.3,
    59276.4,
  );
}
