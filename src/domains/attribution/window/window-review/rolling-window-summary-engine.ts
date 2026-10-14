import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingWindowSummary } from "./rolling-window-summary.js";

/** One step of the rolling window summary calculation. */
export interface RollingWindowSummaryModifier {
  describe(): string;
  adjust(item: RollingWindowSummary, value: number): number;
}

export class FlaggedRollingWindowSummaryAdjuster implements RollingWindowSummaryModifier {
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

  adjust(item: RollingWindowSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingWindowSummaryAdjuster implements RollingWindowSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingWindowSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRollingWindowSummaryAdjuster implements RollingWindowSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingWindowSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingWindowSummaryAdjuster implements RollingWindowSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingWindowSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling window summary steps in order and keeps a trace of each. */
export class RollingWindowSummaryEngine {
  steps: RollingWindowSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingWindowSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingWindowSummary): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: RollingWindowSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingWindowSummaryEngine(flagsValue: flags.Registry): RollingWindowSummaryEngine {
  return new RollingWindowSummaryEngine(
    [
      new FlaggedRollingWindowSummaryAdjuster(flagsValue, "rolling-window-summary-primary", -0.5),
      new MinimumRollingWindowSummaryAdjuster(5.3),
      new PercentRollingWindowSummaryAdjuster(1.1),
      new TieredRollingWindowSummaryAdjuster([6202, 6296, 9443], [1.13, 0.88, 0.98]),
    ],
    [],
    0.1,
    61613.9,
  );
}
