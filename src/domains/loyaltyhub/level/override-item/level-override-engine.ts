import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelOverride } from "./level-override.js";

/** One step of the level override calculation. */
export interface LevelOverrideAdjuster {
  describe(): string;
  adjust(item: LevelOverride, value: number): number;
}

export class FlaggedLevelOverrideAdjuster implements LevelOverrideAdjuster {
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

  adjust(item: LevelOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLevelOverrideAdjuster implements LevelOverrideAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLevelOverrideAdjuster implements LevelOverrideAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LevelOverrideRatioOffsetAdjuster implements LevelOverrideAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: LevelOverride, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class CapLevelOverrideAdjuster implements LevelOverrideAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LevelOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the level override steps in order and keeps a trace of each. */
export class LevelOverrideEngine {
  steps: LevelOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LevelOverride): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: LevelOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLevelOverrideEngine(flagsValue: flags.Registry): LevelOverrideEngine {
  return new LevelOverrideEngine(
    [
      new FlaggedLevelOverrideAdjuster(flagsValue, "level-override-tiered", 7.4),
      new TieredLevelOverrideAdjuster([616, 7135, 8296], [0.96, 0.97, 0.83]),
      new RoundingLevelOverrideAdjuster(5),
      new LevelOverrideRatioOffsetAdjuster(0.12),
      new CapLevelOverrideAdjuster(38538),
    ],
    [],
    3.6,
    28119.5,
  );
}
