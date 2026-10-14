import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackNudgeEntry } from "./fallback-nudge-entry.js";

/** One step of the fallback nudge entry calculation. */
export interface FallbackNudgeEntryFactor {
  describe(): string;
  adjust(item: FallbackNudgeEntry, value: number): number;
}

export class PercentFallbackNudgeEntryAdjuster implements FallbackNudgeEntryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackNudgeEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedFallbackNudgeEntryAdjuster implements FallbackNudgeEntryFactor {
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

  adjust(item: FallbackNudgeEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFallbackNudgeEntryAdjuster implements FallbackNudgeEntryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackNudgeEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback nudge entry steps in order and keeps a trace of each. */
export class FallbackNudgeEntryEngine {
  steps: FallbackNudgeEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackNudgeEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackNudgeEntry): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: FallbackNudgeEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackNudgeEntryEngine(flagsValue: flags.Registry): FallbackNudgeEntryEngine {
  return new FallbackNudgeEntryEngine(
    [
      new PercentFallbackNudgeEntryAdjuster(15.5),
      new FlaggedFallbackNudgeEntryAdjuster(flagsValue, "fallback-nudge-entry-capped", 0.8),
      new MinimumFallbackNudgeEntryAdjuster(34.4),
    ],
    [],
    3,
    94243.5,
  );
}
