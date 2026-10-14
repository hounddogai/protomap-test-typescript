import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaThreshold } from "./sla-threshold.js";

/** One step of the sla threshold calculation. */
export interface SlaThresholdAdjuster {
  describe(): string;
  adjust(item: SlaThreshold, value: number): number;
}

export class MinimumSlaThresholdAdjuster implements SlaThresholdAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSlaThresholdAdjuster implements SlaThresholdAdjuster {
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

  adjust(item: SlaThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSlaThresholdAdjuster implements SlaThresholdAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SlaThresholdBudgetOffsetAdjuster implements SlaThresholdAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: SlaThreshold, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the sla threshold steps in order and keeps a trace of each. */
export class SlaThresholdEngine {
  steps: SlaThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SlaThreshold): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: SlaThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSlaThresholdEngine(flagsValue: flags.Registry): SlaThresholdEngine {
  return new SlaThresholdEngine(
    [
      new MinimumSlaThresholdAdjuster(26.9),
      new FlaggedSlaThresholdAdjuster(flagsValue, "sla-threshold-strict", -4.6),
      new RoundingSlaThresholdAdjuster(5),
      new SlaThresholdBudgetOffsetAdjuster(0.22),
    ],
    [],
    0.6,
    61541.3,
  );
}
