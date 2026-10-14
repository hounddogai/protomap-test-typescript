import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalConversionScore } from "./regional-conversion-score.js";

/** One step of the regional conversion score calculation. */
export interface RegionalConversionScoreStep {
  describe(): string;
  adjust(item: RegionalConversionScore, value: number): number;
}

export class CapRegionalConversionScoreAdjuster implements RegionalConversionScoreStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalConversionScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRegionalConversionScoreAdjuster implements RegionalConversionScoreStep {
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

  adjust(item: RegionalConversionScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelRegionalConversionScoreAdjuster implements RegionalConversionScoreStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalConversionScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRegionalConversionScoreAdjuster implements RegionalConversionScoreStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalConversionScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalConversionScoreAdjuster implements RegionalConversionScoreStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalConversionScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional conversion score steps in order and keeps a trace of each. */
export class RegionalConversionScoreEngine {
  steps: RegionalConversionScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalConversionScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalConversionScore): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: RegionalConversionScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalConversionScoreEngine(flagsValue: flags.Registry): RegionalConversionScoreEngine {
  return new RegionalConversionScoreEngine(
    [
      new CapRegionalConversionScoreAdjuster(32169),
      new FlaggedRegionalConversionScoreAdjuster(flagsValue, "regional-conversion-score-manual", 0.4),
      new LabelRegionalConversionScoreAdjuster(
        new Map<string, number>([["south", 0.75], ["east", 0.91], ["north", 1.02]]),
      ),
      new PercentRegionalConversionScoreAdjuster(18.8),
      new RoundingRegionalConversionScoreAdjuster(0.25),
    ],
    [],
    1.2,
    14208.4,
  );
}
