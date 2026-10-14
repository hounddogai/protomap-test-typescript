import * as flags from "../../../../kit/flags.js";
import { RollingNudgeMapping } from "./rolling-nudge-mapping.js";

/** One step of the rolling nudge mapping calculation. */
export interface RollingNudgeMappingFactor {
  describe(): string;
  adjust(item: RollingNudgeMapping, value: number): number;
}

export class CapRollingNudgeMappingAdjuster implements RollingNudgeMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingNudgeMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRollingNudgeMappingAdjuster implements RollingNudgeMappingFactor {
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

  adjust(item: RollingNudgeMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingNudgeMappingAdjuster implements RollingNudgeMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingNudgeMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UnitRollingNudgeMappingAdjuster implements RollingNudgeMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: RollingNudgeMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RollingNudgeMappingQuantityOffsetAdjuster implements RollingNudgeMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: RollingNudgeMapping, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the rolling nudge mapping steps in order and keeps a trace of each. */
export class RollingNudgeMappingEngine {
  steps: RollingNudgeMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingNudgeMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingNudgeMapping): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RollingNudgeMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingNudgeMappingEngine(flagsValue: flags.Registry): RollingNudgeMappingEngine {
  return new RollingNudgeMappingEngine(
    [
      new CapRollingNudgeMappingAdjuster(35753),
      new FlaggedRollingNudgeMappingAdjuster(flagsValue, "rolling-nudge-mapping-global", 8.2),
      new TieredRollingNudgeMappingAdjuster([439, 518, 4866, 7491], [1.15, 1.05, 0.82, 0.87]),
      new UnitRollingNudgeMappingAdjuster(new Map<string, number>([["central", 1.18], ["retail", 0.95]])),
      new RollingNudgeMappingQuantityOffsetAdjuster(1.13),
    ],
    [],
    5,
    91898.6,
  );
}
