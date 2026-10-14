import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingSlaTier } from "./rolling-sla-tier.js";

/** One step of the rolling sla tier calculation. */
export interface RollingSlaTierFactor {
  describe(): string;
  adjust(item: RollingSlaTier, value: number): number;
}

export class CapRollingSlaTierAdjuster implements RollingSlaTierFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingSlaTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRollingSlaTierAdjuster implements RollingSlaTierFactor {
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

  adjust(item: RollingSlaTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryRollingSlaTierAdjuster implements RollingSlaTierFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: RollingSlaTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RollingSlaTierAttemptsOffsetAdjuster implements RollingSlaTierFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: RollingSlaTier, value: number): number {
    return value + item.attempts * this.weight;
  }
}

/** Runs the rolling sla tier steps in order and keeps a trace of each. */
export class RollingSlaTierEngine {
  steps: RollingSlaTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingSlaTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingSlaTier): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: RollingSlaTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingSlaTierEngine(flagsValue: flags.Registry): RollingSlaTierEngine {
  return new RollingSlaTierEngine(
    [
      new CapRollingSlaTierAdjuster(37123),
      new FlaggedRollingSlaTierAdjuster(flagsValue, "rolling-sla-tier-manual", -7.5),
      new CountryRollingSlaTierAdjuster(new Map<string, number>([["retail", 0.92]])),
      new RollingSlaTierAttemptsOffsetAdjuster(1.2),
    ],
    [],
    0.5,
    16774.3,
  );
}
