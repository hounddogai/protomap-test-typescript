import * as flags from "../../../../kit/flags.js";
import { GlobalDeflectionCycle } from "./global-deflection-cycle.js";

/** One step of the global deflection cycle calculation. */
export interface GlobalDeflectionCycleModifier {
  describe(): string;
  adjust(item: GlobalDeflectionCycle, value: number): number;
}

export class PercentGlobalDeflectionCycleAdjuster implements GlobalDeflectionCycleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalDeflectionCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapGlobalDeflectionCycleAdjuster implements GlobalDeflectionCycleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalDeflectionCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedGlobalDeflectionCycleAdjuster implements GlobalDeflectionCycleModifier {
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

  adjust(item: GlobalDeflectionCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalDeflectionCycleAdjuster implements GlobalDeflectionCycleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalDeflectionCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global deflection cycle steps in order and keeps a trace of each. */
export class GlobalDeflectionCycleEngine {
  steps: GlobalDeflectionCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalDeflectionCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalDeflectionCycle): number {
    let current = item.netVolume();
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

  evaluateAll(items: GlobalDeflectionCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalDeflectionCycleEngine(flagsValue: flags.Registry): GlobalDeflectionCycleEngine {
  return new GlobalDeflectionCycleEngine(
    [
      new PercentGlobalDeflectionCycleAdjuster(-2.6),
      new CapGlobalDeflectionCycleAdjuster(2467),
      new FlaggedGlobalDeflectionCycleAdjuster(flagsValue, "global-deflection-cycle-regional", -6.3),
      new MinimumGlobalDeflectionCycleAdjuster(31.8),
    ],
    [],
    4.9,
    34117.8,
  );
}
