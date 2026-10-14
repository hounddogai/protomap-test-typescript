import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WarmupCycle } from "./warmup-cycle.js";

/** One step of the warmup cycle calculation. */
export interface WarmupCycleFactor {
  describe(): string;
  adjust(item: WarmupCycle, value: number): number;
}

export class PercentWarmupCycleAdjuster implements WarmupCycleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WarmupCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class WarmupCycleFrequencyCapOffsetAdjuster implements WarmupCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: WarmupCycle, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class SourceWarmupCycleAdjuster implements WarmupCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: WarmupCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWarmupCycleAdjuster implements WarmupCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWarmupCycleAdjuster implements WarmupCycleFactor {
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

  adjust(item: WarmupCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the warmup cycle steps in order and keeps a trace of each. */
export class WarmupCycleEngine {
  steps: WarmupCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WarmupCycle): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: WarmupCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWarmupCycleEngine(flagsValue: flags.Registry): WarmupCycleEngine {
  return new WarmupCycleEngine(
    [
      new PercentWarmupCycleAdjuster(-12.9),
      new WarmupCycleFrequencyCapOffsetAdjuster(0.99),
      new SourceWarmupCycleAdjuster(new Map<string, number>([["retail", 1.08]])),
      new TieredWarmupCycleAdjuster([5182, 9727], [0.92, 0.93]),
      new FlaggedWarmupCycleAdjuster(flagsValue, "warmup-cycle-pending", 4.3),
    ],
    [],
    1.2,
    90966.7,
  );
}
