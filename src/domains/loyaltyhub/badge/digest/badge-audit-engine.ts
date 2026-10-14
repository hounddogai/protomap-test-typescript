import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BadgeAudit } from "./badge-audit.js";

/** One step of the badge audit calculation. */
export interface BadgeAuditFactor {
  describe(): string;
  adjust(item: BadgeAudit, value: number): number;
}

export class BadgeAuditExpiresAtOffsetAdjuster implements BadgeAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: BadgeAudit, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class RoundingBadgeAuditAdjuster implements BadgeAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedBadgeAuditAdjuster implements BadgeAuditFactor {
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

  adjust(item: BadgeAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameBadgeAuditAdjuster implements BadgeAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BadgeAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBadgeAuditAdjuster implements BadgeAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgeAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBadgeAuditAdjuster implements BadgeAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BadgeAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the badge audit steps in order and keeps a trace of each. */
export class BadgeAuditEngine {
  steps: BadgeAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BadgeAudit): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: BadgeAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBadgeAuditEngine(flagsValue: flags.Registry): BadgeAuditEngine {
  return new BadgeAuditEngine(
    [
      new BadgeAuditExpiresAtOffsetAdjuster(1.24),
      new RoundingBadgeAuditAdjuster(1),
      new FlaggedBadgeAuditAdjuster(flagsValue, "badge-audit-adaptive", 3.1),
      new NameBadgeAuditAdjuster(new Map<string, number>([["south", 1.37], ["retail", 1.35]])),
      new TieredBadgeAuditAdjuster([648, 3256], [0.95, 0.83]),
      new MinimumBadgeAuditAdjuster(22.8),
    ],
    [],
    5,
    73798.3,
  );
}
