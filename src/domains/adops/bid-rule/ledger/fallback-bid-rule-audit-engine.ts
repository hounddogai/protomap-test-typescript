import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackBidRuleAudit } from "./fallback-bid-rule-audit.js";

/** One step of the fallback bid rule audit calculation. */
export interface FallbackBidRuleAuditAdjuster {
  describe(): string;
  adjust(item: FallbackBidRuleAudit, value: number): number;
}

export class PercentFallbackBidRuleAuditAdjuster implements FallbackBidRuleAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackBidRuleAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackBidRuleAuditAdjuster implements FallbackBidRuleAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackBidRuleAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FallbackBidRuleAuditMinimumOffsetAdjuster implements FallbackBidRuleAuditAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: FallbackBidRuleAudit, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class FlaggedFallbackBidRuleAuditAdjuster implements FallbackBidRuleAuditAdjuster {
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

  adjust(item: FallbackBidRuleAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback bid rule audit steps in order and keeps a trace of each. */
export class FallbackBidRuleAuditEngine {
  steps: FallbackBidRuleAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackBidRuleAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackBidRuleAudit): number {
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

  evaluateAll(items: FallbackBidRuleAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackBidRuleAuditEngine(flagsValue: flags.Registry): FallbackBidRuleAuditEngine {
  return new FallbackBidRuleAuditEngine(
    [
      new PercentFallbackBidRuleAuditAdjuster(22.2),
      new RoundingFallbackBidRuleAuditAdjuster(0.05),
      new FallbackBidRuleAuditMinimumOffsetAdjuster(1.62),
      new FlaggedFallbackBidRuleAuditAdjuster(flagsValue, "fallback-bid-rule-audit-manual", -6.5),
    ],
    [],
    4.5,
    58183.1,
  );
}
