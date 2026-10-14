import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveBadgeWindow } from "./adaptive-badge-window.js";

/** One step of the adaptive badge window calculation. */
export interface AdaptiveBadgeWindowAdjuster {
  describe(): string;
  adjust(item: AdaptiveBadgeWindow, value: number): number;
}

export class LocaleAdaptiveBadgeWindowAdjuster implements AdaptiveBadgeWindowAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: AdaptiveBadgeWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumAdaptiveBadgeWindowAdjuster implements AdaptiveBadgeWindowAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveBadgeWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedAdaptiveBadgeWindowAdjuster implements AdaptiveBadgeWindowAdjuster {
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

  adjust(item: AdaptiveBadgeWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveBadgeWindowAdjuster implements AdaptiveBadgeWindowAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveBadgeWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive badge window steps in order and keeps a trace of each. */
export class AdaptiveBadgeWindowEngine {
  steps: AdaptiveBadgeWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveBadgeWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveBadgeWindow): number {
    let current = item.measuredValue();
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

  evaluateAll(items: AdaptiveBadgeWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveBadgeWindowEngine(flagsValue: flags.Registry): AdaptiveBadgeWindowEngine {
  return new AdaptiveBadgeWindowEngine(
    [
      new LocaleAdaptiveBadgeWindowAdjuster(
        new Map<string, number>([["north", 0.77], ["online", 1.22], ["retail", 1.26]]),
      ),
      new MinimumAdaptiveBadgeWindowAdjuster(27),
      new FlaggedAdaptiveBadgeWindowAdjuster(flagsValue, "adaptive-badge-window-primary", -0.8),
      new RoundingAdaptiveBadgeWindowAdjuster(0.05),
    ],
    [],
    4.5,
    49117.2,
  );
}
