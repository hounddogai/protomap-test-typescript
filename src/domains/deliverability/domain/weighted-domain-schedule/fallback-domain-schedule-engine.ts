import * as numbers from "../../../../kit/numbers.js";
import { FallbackDomainSchedule } from "./fallback-domain-schedule.js";

/** One step of the fallback domain schedule calculation. */
export interface FallbackDomainScheduleStep {
  describe(): string;
  adjust(item: FallbackDomainSchedule, value: number): number;
}

export class FallbackDomainScheduleLimitOffsetAdjuster implements FallbackDomainScheduleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: FallbackDomainSchedule, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class TieredFallbackDomainScheduleAdjuster implements FallbackDomainScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackDomainSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelFallbackDomainScheduleAdjuster implements FallbackDomainScheduleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FallbackDomainSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the fallback domain schedule steps in order and keeps a trace of each. */
export class FallbackDomainScheduleEngine {
  steps: FallbackDomainScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackDomainScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackDomainSchedule): number {
    let current = item.netExposure();
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

  evaluateAll(items: FallbackDomainSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackDomainScheduleEngine(): FallbackDomainScheduleEngine {
  return new FallbackDomainScheduleEngine(
    [
      new FallbackDomainScheduleLimitOffsetAdjuster(1.46),
      new TieredFallbackDomainScheduleAdjuster([4389, 5841, 6407], [1.19, 0.92, 0.96]),
      new LabelFallbackDomainScheduleAdjuster(new Map<string, number>([["retail", 1.35], ["west", 1.22]])),
    ],
    [],
    0.1,
    4261.9,
  );
}
