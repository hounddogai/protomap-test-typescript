import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierAudit } from "./tier-audit.js";

/** One step of the tier audit calculation. */
export interface TierAuditModifier {
  describe(): string;
  adjust(item: TierAudit, value: number): number;
}

export class CapTierAuditAdjuster implements TierAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TierAuditRatioOffsetAdjuster implements TierAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: TierAudit, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class RoundingTierAuditAdjuster implements TierAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTierAuditAdjuster implements TierAuditModifier {
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

  adjust(item: TierAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionTierAuditAdjuster implements TierAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: TierAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tier audit steps in order and keeps a trace of each. */
export class TierAuditEngine {
  steps: TierAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TierAudit): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: TierAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTierAuditEngine(flagsValue: flags.Registry): TierAuditEngine {
  return new TierAuditEngine(
    [
      new CapTierAuditAdjuster(30663),
      new TierAuditRatioOffsetAdjuster(0.35),
      new RoundingTierAuditAdjuster(0.1),
      new FlaggedTierAuditAdjuster(flagsValue, "tier-audit-regional", -0.9),
      new RegionTierAuditAdjuster(new Map<string, number>([["north", 1.05], ["online", 1.07]])),
    ],
    [],
    4,
    71476.2,
  );
}
