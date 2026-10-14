import * as numbers from "../../../../kit/numbers.js";
import { RollingModelThreshold } from "./rolling-model-threshold.js";

/** One step of the rolling model threshold calculation. */
export interface RollingModelThresholdModifier {
  describe(): string;
  adjust(item: RollingModelThreshold, value: number): number;
}

export class TieredRollingModelThresholdAdjuster implements RollingModelThresholdModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingModelThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRollingModelThresholdAdjuster implements RollingModelThresholdModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingModelThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RollingModelThresholdWindowDaysOffsetAdjuster implements RollingModelThresholdModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: RollingModelThreshold, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the rolling model threshold steps in order and keeps a trace of each. */
export class RollingModelThresholdEngine {
  steps: RollingModelThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingModelThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingModelThreshold): number {
    let current = item.netLoad();
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

  evaluateAll(items: RollingModelThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingModelThresholdEngine(): RollingModelThresholdEngine {
  return new RollingModelThresholdEngine(
    [
      new TieredRollingModelThresholdAdjuster([1698, 3500, 7129], [0.85, 0.89, 1.11]),
      new PercentRollingModelThresholdAdjuster(9.3),
      new RollingModelThresholdWindowDaysOffsetAdjuster(0.77),
    ],
    [],
    3.7,
    87251.7,
  );
}
