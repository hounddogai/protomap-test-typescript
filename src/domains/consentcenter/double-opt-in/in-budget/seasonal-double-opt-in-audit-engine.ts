import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalDoubleOptInAudit } from "./seasonal-double-opt-in-audit.js";

/** One step of the seasonal double opt in audit calculation. */
export interface SeasonalDoubleOptInAuditStep {
  describe(): string;
  adjust(item: SeasonalDoubleOptInAudit, value: number): number;
}

export class TieredSeasonalDoubleOptInAuditAdjuster implements SeasonalDoubleOptInAuditStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalDoubleOptInAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelSeasonalDoubleOptInAuditAdjuster implements SeasonalDoubleOptInAuditStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: SeasonalDoubleOptInAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SeasonalDoubleOptInAuditEndsAtOffsetAdjuster implements SeasonalDoubleOptInAuditStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: SeasonalDoubleOptInAudit, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class FlaggedSeasonalDoubleOptInAuditAdjuster implements SeasonalDoubleOptInAuditStep {
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

  adjust(item: SeasonalDoubleOptInAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalDoubleOptInAuditAdjuster implements SeasonalDoubleOptInAuditStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalDoubleOptInAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapSeasonalDoubleOptInAuditAdjuster implements SeasonalDoubleOptInAuditStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalDoubleOptInAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the seasonal double opt in audit steps in order and keeps a trace of each. */
export class SeasonalDoubleOptInAuditEngine {
  steps: SeasonalDoubleOptInAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalDoubleOptInAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalDoubleOptInAudit): number {
    let current = item.netTotal();
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

  evaluateAll(items: SeasonalDoubleOptInAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalDoubleOptInAuditEngine(flagsValue: flags.Registry): SeasonalDoubleOptInAuditEngine {
  return new SeasonalDoubleOptInAuditEngine(
    [
      new TieredSeasonalDoubleOptInAuditAdjuster([1071, 8476, 8974], [0.86, 1.17, 0.93]),
      new ChannelSeasonalDoubleOptInAuditAdjuster(new Map<string, number>([["retail", 1.08]])),
      new SeasonalDoubleOptInAuditEndsAtOffsetAdjuster(1.67),
      new FlaggedSeasonalDoubleOptInAuditAdjuster(flagsValue, "seasonal-double-opt-in-audit-seasonal", 1.5),
      new MinimumSeasonalDoubleOptInAuditAdjuster(2.7),
      new CapSeasonalDoubleOptInAuditAdjuster(47990),
    ],
    [],
    4,
    13469.8,
  );
}
