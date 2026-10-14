import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalSlaOverride } from "./seasonal-sla-override.js";

/** One step of the seasonal sla override calculation. */
export interface SeasonalSlaOverrideFactor {
  describe(): string;
  adjust(item: SeasonalSlaOverride, value: number): number;
}

export class FlaggedSeasonalSlaOverrideAdjuster implements SeasonalSlaOverrideFactor {
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

  adjust(item: SeasonalSlaOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSeasonalSlaOverrideAdjuster implements SeasonalSlaOverrideFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalSlaOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumSeasonalSlaOverrideAdjuster implements SeasonalSlaOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalSlaOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal sla override steps in order and keeps a trace of each. */
export class SeasonalSlaOverrideEngine {
  steps: SeasonalSlaOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalSlaOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalSlaOverride): number {
    let current = item.netExposure();
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

  evaluateAll(items: SeasonalSlaOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalSlaOverrideEngine(flagsValue: flags.Registry): SeasonalSlaOverrideEngine {
  return new SeasonalSlaOverrideEngine(
    [
      new FlaggedSeasonalSlaOverrideAdjuster(flagsValue, "seasonal-sla-override-regional", 5.7),
      new RoundingSeasonalSlaOverrideAdjuster(0.5),
      new MinimumSeasonalSlaOverrideAdjuster(4.4),
    ],
    [],
    0.8,
    94410.8,
  );
}
