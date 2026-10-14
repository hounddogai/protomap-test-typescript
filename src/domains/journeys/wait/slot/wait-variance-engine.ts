import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WaitVariance } from "./wait-variance.js";

/** One step of the wait variance calculation. */
export interface WaitVarianceStep {
  describe(): string;
  adjust(item: WaitVariance, value: number): number;
}

export class FlaggedWaitVarianceAdjuster implements WaitVarianceStep {
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

  adjust(item: WaitVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWaitVarianceAdjuster implements WaitVarianceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWaitVarianceAdjuster implements WaitVarianceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WaitVarianceCreatedAtOffsetAdjuster implements WaitVarianceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: WaitVariance, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the wait variance steps in order and keeps a trace of each. */
export class WaitVarianceEngine {
  steps: WaitVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WaitVariance): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: WaitVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWaitVarianceEngine(flagsValue: flags.Registry): WaitVarianceEngine {
  return new WaitVarianceEngine(
    [
      new FlaggedWaitVarianceAdjuster(flagsValue, "wait-variance-adaptive", 6.3),
      new CapWaitVarianceAdjuster(37764),
      new RoundingWaitVarianceAdjuster(0.1),
      new WaitVarianceCreatedAtOffsetAdjuster(0.97),
    ],
    [],
    0.9,
    14116.3,
  );
}
