import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyWaitRollup } from "./legacy-wait-rollup.js";

/** One step of the legacy wait rollup calculation. */
export interface LegacyWaitRollupFactor {
  describe(): string;
  adjust(item: LegacyWaitRollup, value: number): number;
}

export class CapLegacyWaitRollupAdjuster implements LegacyWaitRollupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyWaitRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedLegacyWaitRollupAdjuster implements LegacyWaitRollupFactor {
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

  adjust(item: LegacyWaitRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LegacyWaitRollupImpressionsOffsetAdjuster implements LegacyWaitRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: LegacyWaitRollup, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class RoundingLegacyWaitRollupAdjuster implements LegacyWaitRollupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyWaitRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy wait rollup steps in order and keeps a trace of each. */
export class LegacyWaitRollupEngine {
  steps: LegacyWaitRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyWaitRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyWaitRollup): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: LegacyWaitRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyWaitRollupEngine(flagsValue: flags.Registry): LegacyWaitRollupEngine {
  return new LegacyWaitRollupEngine(
    [
      new CapLegacyWaitRollupAdjuster(25833),
      new FlaggedLegacyWaitRollupAdjuster(flagsValue, "legacy-wait-rollup-pending", 4),
      new LegacyWaitRollupImpressionsOffsetAdjuster(0.66),
      new RoundingLegacyWaitRollupAdjuster(1),
    ],
    [],
    4.4,
    11646.3,
  );
}
