import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationMapping } from "./reputation-mapping.js";

/** One step of the reputation mapping calculation. */
export interface ReputationMappingAdjuster {
  describe(): string;
  adjust(item: ReputationMapping, value: number): number;
}

export class FlaggedReputationMappingAdjuster implements ReputationMappingAdjuster {
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

  adjust(item: ReputationMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ReputationMappingGraceDaysOffsetAdjuster implements ReputationMappingAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ReputationMapping, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class TieredReputationMappingAdjuster implements ReputationMappingAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapReputationMappingAdjuster implements ReputationMappingAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReputationMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleReputationMappingAdjuster implements ReputationMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ReputationMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reputation mapping steps in order and keeps a trace of each. */
export class ReputationMappingEngine {
  steps: ReputationMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReputationMapping): number {
    let current = item.projectedValue();
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

  evaluateAll(items: ReputationMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReputationMappingEngine(flagsValue: flags.Registry): ReputationMappingEngine {
  return new ReputationMappingEngine(
    [
      new FlaggedReputationMappingAdjuster(flagsValue, "reputation-mapping-tiered", 9.5),
      new ReputationMappingGraceDaysOffsetAdjuster(0.04),
      new TieredReputationMappingAdjuster([1107, 2744, 5114], [1.06, 0.87, 0.94]),
      new CapReputationMappingAdjuster(25247),
      new LocaleReputationMappingAdjuster(
        new Map<string, number>([["retail", 0.8], ["south", 1.01], ["west", 1.19]]),
      ),
    ],
    [],
    4.6,
    4078.8,
  );
}
