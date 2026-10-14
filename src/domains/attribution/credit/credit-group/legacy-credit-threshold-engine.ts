import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyCreditThreshold } from "./legacy-credit-threshold.js";

/** One step of the legacy credit threshold calculation. */
export interface LegacyCreditThresholdStep {
  describe(): string;
  adjust(item: LegacyCreditThreshold, value: number): number;
}

export class FlaggedLegacyCreditThresholdAdjuster implements LegacyCreditThresholdStep {
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

  adjust(item: LegacyCreditThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyCreditThresholdAdjuster implements LegacyCreditThresholdStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyCreditThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyCreditThresholdAdjuster implements LegacyCreditThresholdStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyCreditThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLegacyCreditThresholdAdjuster implements LegacyCreditThresholdStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyCreditThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLegacyCreditThresholdAdjuster implements LegacyCreditThresholdStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyCreditThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy credit threshold steps in order and keeps a trace of each. */
export class LegacyCreditThresholdEngine {
  steps: LegacyCreditThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyCreditThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyCreditThreshold): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: LegacyCreditThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyCreditThresholdEngine(flagsValue: flags.Registry): LegacyCreditThresholdEngine {
  return new LegacyCreditThresholdEngine(
    [
      new FlaggedLegacyCreditThresholdAdjuster(flagsValue, "legacy-credit-threshold-seasonal", -9),
      new MinimumLegacyCreditThresholdAdjuster(38.8),
      new RoundingLegacyCreditThresholdAdjuster(0.5),
      new PercentLegacyCreditThresholdAdjuster(-21.6),
      new TieredLegacyCreditThresholdAdjuster([92, 665, 2539, 5665], [1.18, 1.11, 1.03, 1.16]),
    ],
    [],
    2.2,
    22367,
  );
}
