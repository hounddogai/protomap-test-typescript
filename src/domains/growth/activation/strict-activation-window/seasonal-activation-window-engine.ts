import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalActivationWindow } from "./seasonal-activation-window.js";

/** One step of the seasonal activation window calculation. */
export interface SeasonalActivationWindowAdjuster {
  describe(): string;
  adjust(item: SeasonalActivationWindow, value: number): number;
}

export class FlaggedSeasonalActivationWindowAdjuster implements SeasonalActivationWindowAdjuster {
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

  adjust(item: SeasonalActivationWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSeasonalActivationWindowAdjuster implements SeasonalActivationWindowAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalActivationWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSeasonalActivationWindowAdjuster implements SeasonalActivationWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalActivationWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingSeasonalActivationWindowAdjuster implements SeasonalActivationWindowAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalActivationWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SeasonalActivationWindowPriorityOffsetAdjuster implements SeasonalActivationWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: SeasonalActivationWindow, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class PercentSeasonalActivationWindowAdjuster implements SeasonalActivationWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalActivationWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal activation window steps in order and keeps a trace of each. */
export class SeasonalActivationWindowEngine {
  steps: SeasonalActivationWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalActivationWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalActivationWindow): number {
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

  evaluateAll(items: SeasonalActivationWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalActivationWindowEngine(flagsValue: flags.Registry): SeasonalActivationWindowEngine {
  return new SeasonalActivationWindowEngine(
    [
      new FlaggedSeasonalActivationWindowAdjuster(flagsValue, "seasonal-activation-window-batched", 7.2),
      new TieredSeasonalActivationWindowAdjuster([603, 6249, 8550], [1.19, 1.05, 0.84]),
      new CapSeasonalActivationWindowAdjuster(12185),
      new RoundingSeasonalActivationWindowAdjuster(0.05),
      new SeasonalActivationWindowPriorityOffsetAdjuster(0.68),
      new PercentSeasonalActivationWindowAdjuster(1.2),
    ],
    [],
    2.5,
    87875.4,
  );
}
