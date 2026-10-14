import * as flags from "../../../../kit/flags.js";
import { WindowThreshold } from "./window-threshold.js";

/** One step of the window threshold calculation. */
export interface WindowThresholdAdjuster {
  describe(): string;
  adjust(item: WindowThreshold, value: number): number;
}

export class TieredWindowThresholdAdjuster implements WindowThresholdAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapWindowThresholdAdjuster implements WindowThresholdAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWindowThresholdAdjuster implements WindowThresholdAdjuster {
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

  adjust(item: WindowThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the window threshold steps in order and keeps a trace of each. */
export class WindowThresholdEngine {
  steps: WindowThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WindowThreshold): number {
    let current = item.effectiveExposure();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: WindowThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWindowThresholdEngine(flagsValue: flags.Registry): WindowThresholdEngine {
  return new WindowThresholdEngine(
    [
      new TieredWindowThresholdAdjuster([1996, 7471], [1.09, 0.94]),
      new CapWindowThresholdAdjuster(46384),
      new FlaggedWindowThresholdAdjuster(flagsValue, "window-threshold-tiered", 7.2),
    ],
    [],
    0.4,
    84680.4,
  );
}
