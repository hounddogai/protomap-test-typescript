import * as flags from "../../../../kit/flags.js";
import { FallbackCreativeWindow } from "./fallback-creative-window.js";

/** One step of the fallback creative window calculation. */
export interface FallbackCreativeWindowFactor {
  describe(): string;
  adjust(item: FallbackCreativeWindow, value: number): number;
}

export class FlaggedFallbackCreativeWindowAdjuster implements FallbackCreativeWindowFactor {
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

  adjust(item: FallbackCreativeWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FallbackCreativeWindowOpenRateOffsetAdjuster implements FallbackCreativeWindowFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: FallbackCreativeWindow, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class MinimumFallbackCreativeWindowAdjuster implements FallbackCreativeWindowFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackCreativeWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback creative window steps in order and keeps a trace of each. */
export class FallbackCreativeWindowEngine {
  steps: FallbackCreativeWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackCreativeWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackCreativeWindow): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: FallbackCreativeWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackCreativeWindowEngine(flagsValue: flags.Registry): FallbackCreativeWindowEngine {
  return new FallbackCreativeWindowEngine(
    [
      new FlaggedFallbackCreativeWindowAdjuster(flagsValue, "fallback-creative-window-tiered", 9.6),
      new FallbackCreativeWindowOpenRateOffsetAdjuster(0.99),
      new MinimumFallbackCreativeWindowAdjuster(1.9),
    ],
    [],
    3.4,
    11684.8,
  );
}
