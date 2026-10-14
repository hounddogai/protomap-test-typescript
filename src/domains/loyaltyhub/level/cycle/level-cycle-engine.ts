import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelCycle } from "./level-cycle.js";

/** One step of the level cycle calculation. */
export interface LevelCycleStep {
  describe(): string;
  adjust(item: LevelCycle, value: number): number;
}

export class TieredLevelCycleAdjuster implements LevelCycleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LevelCycleQuantityOffsetAdjuster implements LevelCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: LevelCycle, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class ChannelLevelCycleAdjuster implements LevelCycleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LevelCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLevelCycleAdjuster implements LevelCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLevelCycleAdjuster implements LevelCycleStep {
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

  adjust(item: LevelCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the level cycle steps in order and keeps a trace of each. */
export class LevelCycleEngine {
  steps: LevelCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LevelCycle): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LevelCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLevelCycleEngine(flagsValue: flags.Registry): LevelCycleEngine {
  return new LevelCycleEngine(
    [
      new TieredLevelCycleAdjuster([4338, 4856, 5450, 7062], [1.12, 0.87, 0.91, 1.17]),
      new LevelCycleQuantityOffsetAdjuster(1.82),
      new ChannelLevelCycleAdjuster(new Map<string, number>([["east", 1.25]])),
      new RoundingLevelCycleAdjuster(0.5),
      new FlaggedLevelCycleAdjuster(flagsValue, "level-cycle-manual", 6.6),
    ],
    [],
    3.1,
    39778.5,
  );
}
