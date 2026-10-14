import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacySuppressionVariance } from "./legacy-suppression-variance.js";

/** One step of the legacy suppression variance calculation. */
export interface LegacySuppressionVarianceAdjuster {
  describe(): string;
  adjust(item: LegacySuppressionVariance, value: number): number;
}

export class SegmentLegacySuppressionVarianceAdjuster implements LegacySuppressionVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LegacySuppressionVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LegacySuppressionVarianceFrequencyCapOffsetAdjuster implements LegacySuppressionVarianceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: LegacySuppressionVariance, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class FlaggedLegacySuppressionVarianceAdjuster implements LegacySuppressionVarianceAdjuster {
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

  adjust(item: LegacySuppressionVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacySuppressionVarianceAdjuster implements LegacySuppressionVarianceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacySuppressionVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLegacySuppressionVarianceAdjuster implements LegacySuppressionVarianceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacySuppressionVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLegacySuppressionVarianceAdjuster implements LegacySuppressionVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacySuppressionVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the legacy suppression variance steps in order and keeps a trace of each. */
export class LegacySuppressionVarianceEngine {
  steps: LegacySuppressionVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacySuppressionVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacySuppressionVariance): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LegacySuppressionVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacySuppressionVarianceEngine(flagsValue: flags.Registry): LegacySuppressionVarianceEngine {
  return new LegacySuppressionVarianceEngine(
    [
      new SegmentLegacySuppressionVarianceAdjuster(
        new Map<string, number>([["central", 0.95], ["retail", 1.06]]),
      ),
      new LegacySuppressionVarianceFrequencyCapOffsetAdjuster(0.61),
      new FlaggedLegacySuppressionVarianceAdjuster(flagsValue, "legacy-suppression-variance-default", -9.7),
      new CapLegacySuppressionVarianceAdjuster(47544),
      new TieredLegacySuppressionVarianceAdjuster([4020, 4626, 6345], [1.1, 0.85, 1.14]),
      new MinimumLegacySuppressionVarianceAdjuster(9.5),
    ],
    [],
    4.3,
    67998.4,
  );
}
