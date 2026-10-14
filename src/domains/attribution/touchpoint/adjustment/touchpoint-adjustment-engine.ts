import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TouchpointAdjustment } from "./touchpoint-adjustment.js";

/** One step of the touchpoint adjustment calculation. */
export interface TouchpointAdjustmentAdjuster {
  describe(): string;
  adjust(item: TouchpointAdjustment, value: number): number;
}

export class FlaggedTouchpointAdjustmentAdjuster implements TouchpointAdjustmentAdjuster {
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

  adjust(item: TouchpointAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTouchpointAdjustmentAdjuster implements TouchpointAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TouchpointAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTouchpointAdjustmentAdjuster implements TouchpointAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TouchpointAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTouchpointAdjustmentAdjuster implements TouchpointAdjustmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TouchpointAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the touchpoint adjustment steps in order and keeps a trace of each. */
export class TouchpointAdjustmentEngine {
  steps: TouchpointAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TouchpointAdjustment): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: TouchpointAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTouchpointAdjustmentEngine(flagsValue: flags.Registry): TouchpointAdjustmentEngine {
  return new TouchpointAdjustmentEngine(
    [
      new FlaggedTouchpointAdjustmentAdjuster(flagsValue, "touchpoint-adjustment-default", 3),
      new RoundingTouchpointAdjustmentAdjuster(0.1),
      new PercentTouchpointAdjustmentAdjuster(24.5),
      new TieredTouchpointAdjustmentAdjuster([774, 4521, 6386, 9394], [0.96, 1.18, 0.84, 0.85]),
    ],
    [],
    3.7,
    24497.9,
  );
}
