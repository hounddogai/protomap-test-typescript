import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackFrequencyCycle } from "./fallback-frequency-cycle.js";

/** One step of the fallback frequency cycle calculation. */
export interface FallbackFrequencyCycleAdjuster {
  describe(): string;
  adjust(item: FallbackFrequencyCycle, value: number): number;
}

export class CapFallbackFrequencyCycleAdjuster implements FallbackFrequencyCycleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackFrequencyCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedFallbackFrequencyCycleAdjuster implements FallbackFrequencyCycleAdjuster {
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

  adjust(item: FallbackFrequencyCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFallbackFrequencyCycleAdjuster implements FallbackFrequencyCycleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackFrequencyCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelFallbackFrequencyCycleAdjuster implements FallbackFrequencyCycleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FallbackFrequencyCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackFrequencyCycleQuantityOffsetAdjuster implements FallbackFrequencyCycleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: FallbackFrequencyCycle, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class RoundingFallbackFrequencyCycleAdjuster implements FallbackFrequencyCycleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackFrequencyCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback frequency cycle steps in order and keeps a trace of each. */
export class FallbackFrequencyCycleEngine {
  steps: FallbackFrequencyCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFrequencyCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackFrequencyCycle): number {
    let current = item.netTotal();
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

  evaluateAll(items: FallbackFrequencyCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackFrequencyCycleEngine(flagsValue: flags.Registry): FallbackFrequencyCycleEngine {
  return new FallbackFrequencyCycleEngine(
    [
      new CapFallbackFrequencyCycleAdjuster(17978),
      new FlaggedFallbackFrequencyCycleAdjuster(flagsValue, "fallback-frequency-cycle-legacy", -7.1),
      new PercentFallbackFrequencyCycleAdjuster(6.1),
      new LabelFallbackFrequencyCycleAdjuster(new Map<string, number>([["retail", 0.97]])),
      new FallbackFrequencyCycleQuantityOffsetAdjuster(1.81),
      new RoundingFallbackFrequencyCycleAdjuster(0.25),
    ],
    [],
    1.8,
    97678.6,
  );
}
