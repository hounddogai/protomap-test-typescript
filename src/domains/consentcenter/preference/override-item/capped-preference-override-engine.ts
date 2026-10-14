import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedPreferenceOverride } from "./capped-preference-override.js";

/** One step of the capped preference override calculation. */
export interface CappedPreferenceOverrideAdjuster {
  describe(): string;
  adjust(item: CappedPreferenceOverride, value: number): number;
}

export class RoundingCappedPreferenceOverrideAdjuster implements CappedPreferenceOverrideAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedPreferenceOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCappedPreferenceOverrideAdjuster implements CappedPreferenceOverrideAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedPreferenceOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCappedPreferenceOverrideAdjuster implements CappedPreferenceOverrideAdjuster {
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

  adjust(item: CappedPreferenceOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCappedPreferenceOverrideAdjuster implements CappedPreferenceOverrideAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedPreferenceOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedPreferenceOverrideAdjuster implements CappedPreferenceOverrideAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedPreferenceOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the capped preference override steps in order and keeps a trace of each. */
export class CappedPreferenceOverrideEngine {
  steps: CappedPreferenceOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedPreferenceOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedPreferenceOverride): number {
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

  evaluateAll(items: CappedPreferenceOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedPreferenceOverrideEngine(flagsValue: flags.Registry): CappedPreferenceOverrideEngine {
  return new CappedPreferenceOverrideEngine(
    [
      new RoundingCappedPreferenceOverrideAdjuster(1),
      new TieredCappedPreferenceOverrideAdjuster([375, 3992, 5486], [1.08, 0.96, 0.87]),
      new FlaggedCappedPreferenceOverrideAdjuster(flagsValue, "capped-preference-override-manual", 7.4),
      new PercentCappedPreferenceOverrideAdjuster(-14.2),
      new CapCappedPreferenceOverrideAdjuster(32316),
    ],
    [],
    1.4,
    94253.6,
  );
}
