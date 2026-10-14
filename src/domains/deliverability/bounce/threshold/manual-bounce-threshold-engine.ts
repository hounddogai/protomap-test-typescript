import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualBounceThreshold } from "./manual-bounce-threshold.js";

/** One step of the manual bounce threshold calculation. */
export interface ManualBounceThresholdAdjuster {
  describe(): string;
  adjust(item: ManualBounceThreshold, value: number): number;
}

export class FlaggedManualBounceThresholdAdjuster implements ManualBounceThresholdAdjuster {
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

  adjust(item: ManualBounceThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapManualBounceThresholdAdjuster implements ManualBounceThresholdAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualBounceThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualBounceThresholdAdjuster implements ManualBounceThresholdAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualBounceThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredManualBounceThresholdAdjuster implements ManualBounceThresholdAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualBounceThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingManualBounceThresholdAdjuster implements ManualBounceThresholdAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualBounceThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual bounce threshold steps in order and keeps a trace of each. */
export class ManualBounceThresholdEngine {
  steps: ManualBounceThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualBounceThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualBounceThreshold): number {
    let current = item.netVolume();
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

  evaluateAll(items: ManualBounceThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualBounceThresholdEngine(flagsValue: flags.Registry): ManualBounceThresholdEngine {
  return new ManualBounceThresholdEngine(
    [
      new FlaggedManualBounceThresholdAdjuster(flagsValue, "manual-bounce-threshold-fallback", -3.5),
      new CapManualBounceThresholdAdjuster(18890),
      new MinimumManualBounceThresholdAdjuster(39.4),
      new TieredManualBounceThresholdAdjuster([3107, 3772, 7152], [1.19, 0.97, 1.01]),
      new RoundingManualBounceThresholdAdjuster(5),
    ],
    [],
    2.5,
    53351.3,
  );
}
