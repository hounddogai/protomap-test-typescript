import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PacingWindow } from "./pacing-window.js";

/** One step of the pacing window calculation. */
export interface PacingWindowAdjuster {
  describe(): string;
  adjust(item: PacingWindow, value: number): number;
}

export class RegionPacingWindowAdjuster implements PacingWindowAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: PacingWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPacingWindowAdjuster implements PacingWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPacingWindowAdjuster implements PacingWindowAdjuster {
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

  adjust(item: PacingWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPacingWindowAdjuster implements PacingWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PacingWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPacingWindowAdjuster implements PacingWindowAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PacingWindowDurationMinutesOffsetAdjuster implements PacingWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: PacingWindow, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the pacing window steps in order and keeps a trace of each. */
export class PacingWindowEngine {
  steps: PacingWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PacingWindow): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PacingWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPacingWindowEngine(flagsValue: flags.Registry): PacingWindowEngine {
  return new PacingWindowEngine(
    [
      new RegionPacingWindowAdjuster(new Map<string, number>([["south", 0.87], ["central", 1.23]])),
      new CapPacingWindowAdjuster(34458),
      new FlaggedPacingWindowAdjuster(flagsValue, "pacing-window-tiered", -5.2),
      new PercentPacingWindowAdjuster(18.6),
      new RoundingPacingWindowAdjuster(0.25),
      new PacingWindowDurationMinutesOffsetAdjuster(1.53),
    ],
    [],
    5,
    82305,
  );
}
