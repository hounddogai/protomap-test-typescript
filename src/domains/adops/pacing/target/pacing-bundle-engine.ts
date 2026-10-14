import * as flags from "../../../../kit/flags.js";
import { PacingBundle } from "./pacing-bundle.js";

/** One step of the pacing bundle calculation. */
export interface PacingBundleAdjuster {
  describe(): string;
  adjust(item: PacingBundle, value: number): number;
}

export class FlaggedPacingBundleAdjuster implements PacingBundleAdjuster {
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

  adjust(item: PacingBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPacingBundleAdjuster implements PacingBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumPacingBundleAdjuster implements PacingBundleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PacingBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pacing bundle steps in order and keeps a trace of each. */
export class PacingBundleEngine {
  steps: PacingBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PacingBundle): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: PacingBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPacingBundleEngine(flagsValue: flags.Registry): PacingBundleEngine {
  return new PacingBundleEngine(
    [
      new FlaggedPacingBundleAdjuster(flagsValue, "pacing-bundle-manual", 0.4),
      new CapPacingBundleAdjuster(8682),
      new MinimumPacingBundleAdjuster(43.5),
    ],
    [],
    2.8,
    85943.4,
  );
}
