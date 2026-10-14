import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalSlaDigest } from "./global-sla-digest.js";

/** One step of the global sla digest calculation. */
export interface GlobalSlaDigestFactor {
  describe(): string;
  adjust(item: GlobalSlaDigest, value: number): number;
}

export class MinimumGlobalSlaDigestAdjuster implements GlobalSlaDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalSlaDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class GlobalSlaDigestWindowDaysOffsetAdjuster implements GlobalSlaDigestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: GlobalSlaDigest, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class FlaggedGlobalSlaDigestAdjuster implements GlobalSlaDigestFactor {
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

  adjust(item: GlobalSlaDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentGlobalSlaDigestAdjuster implements GlobalSlaDigestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalSlaDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalSlaDigestAdjuster implements GlobalSlaDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalSlaDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global sla digest steps in order and keeps a trace of each. */
export class GlobalSlaDigestEngine {
  steps: GlobalSlaDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalSlaDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalSlaDigest): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: GlobalSlaDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalSlaDigestEngine(flagsValue: flags.Registry): GlobalSlaDigestEngine {
  return new GlobalSlaDigestEngine(
    [
      new MinimumGlobalSlaDigestAdjuster(45.1),
      new GlobalSlaDigestWindowDaysOffsetAdjuster(1.22),
      new FlaggedGlobalSlaDigestAdjuster(flagsValue, "global-sla-digest-regional", -8.8),
      new PercentGlobalSlaDigestAdjuster(-10.6),
      new RoundingGlobalSlaDigestAdjuster(5),
    ],
    [],
    0.1,
    64800.7,
  );
}
