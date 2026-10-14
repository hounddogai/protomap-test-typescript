import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryTouchpointWindow } from "./primary-touchpoint-window.js";

/** One step of the primary touchpoint window calculation. */
export interface PrimaryTouchpointWindowFactor {
  describe(): string;
  adjust(item: PrimaryTouchpointWindow, value: number): number;
}

export class FlaggedPrimaryTouchpointWindowAdjuster implements PrimaryTouchpointWindowFactor {
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

  adjust(item: PrimaryTouchpointWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryTouchpointWindowAdjuster implements PrimaryTouchpointWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryTouchpointWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPrimaryTouchpointWindowAdjuster implements PrimaryTouchpointWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryTouchpointWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPrimaryTouchpointWindowAdjuster implements PrimaryTouchpointWindowFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryTouchpointWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPrimaryTouchpointWindowAdjuster implements PrimaryTouchpointWindowFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryTouchpointWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the primary touchpoint window steps in order and keeps a trace of each. */
export class PrimaryTouchpointWindowEngine {
  steps: PrimaryTouchpointWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryTouchpointWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryTouchpointWindow): number {
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

  evaluateAll(items: PrimaryTouchpointWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryTouchpointWindowEngine(flagsValue: flags.Registry): PrimaryTouchpointWindowEngine {
  return new PrimaryTouchpointWindowEngine(
    [
      new FlaggedPrimaryTouchpointWindowAdjuster(flagsValue, "primary-touchpoint-window-tiered", -8.4),
      new CapPrimaryTouchpointWindowAdjuster(13816),
      new RoundingPrimaryTouchpointWindowAdjuster(5),
      new MinimumPrimaryTouchpointWindowAdjuster(18.3),
      new TieredPrimaryTouchpointWindowAdjuster([2390, 2500, 3932], [0.96, 0.86, 0.8]),
    ],
    [],
    4.1,
    85966,
  );
}
