import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveFlightOverride } from "./adaptive-flight-override.js";

/** One step of the adaptive flight override calculation. */
export interface AdaptiveFlightOverrideAdjuster {
  describe(): string;
  adjust(item: AdaptiveFlightOverride, value: number): number;
}

export class AdaptiveFlightOverrideCostOffsetAdjuster implements AdaptiveFlightOverrideAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: AdaptiveFlightOverride, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class FlaggedAdaptiveFlightOverrideAdjuster implements AdaptiveFlightOverrideAdjuster {
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

  adjust(item: AdaptiveFlightOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveFlightOverrideAdjuster implements AdaptiveFlightOverrideAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveFlightOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumAdaptiveFlightOverrideAdjuster implements AdaptiveFlightOverrideAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveFlightOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapAdaptiveFlightOverrideAdjuster implements AdaptiveFlightOverrideAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveFlightOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentAdaptiveFlightOverrideAdjuster implements AdaptiveFlightOverrideAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveFlightOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive flight override steps in order and keeps a trace of each. */
export class AdaptiveFlightOverrideEngine {
  steps: AdaptiveFlightOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveFlightOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveFlightOverride): number {
    let current = item.netValue();
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

  evaluateAll(items: AdaptiveFlightOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveFlightOverrideEngine(flagsValue: flags.Registry): AdaptiveFlightOverrideEngine {
  return new AdaptiveFlightOverrideEngine(
    [
      new AdaptiveFlightOverrideCostOffsetAdjuster(0.19),
      new FlaggedAdaptiveFlightOverrideAdjuster(flagsValue, "adaptive-flight-override-pending", 1.2),
      new RoundingAdaptiveFlightOverrideAdjuster(0.25),
      new MinimumAdaptiveFlightOverrideAdjuster(7.3),
      new CapAdaptiveFlightOverrideAdjuster(8298),
      new PercentAdaptiveFlightOverrideAdjuster(-2.2),
    ],
    [],
    1,
    5111,
  );
}
