import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalPacingVariance } from "./regional-pacing-variance.js";

/** One step of the regional pacing variance calculation. */
export interface RegionalPacingVarianceModifier {
  describe(): string;
  adjust(item: RegionalPacingVariance, value: number): number;
}

export class PercentRegionalPacingVarianceAdjuster implements RegionalPacingVarianceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalPacingVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRegionalPacingVarianceAdjuster implements RegionalPacingVarianceModifier {
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

  adjust(item: RegionalPacingVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalPacingVarianceAdjuster implements RegionalPacingVarianceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalPacingVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRegionalPacingVarianceAdjuster implements RegionalPacingVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalPacingVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional pacing variance steps in order and keeps a trace of each. */
export class RegionalPacingVarianceEngine {
  steps: RegionalPacingVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPacingVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalPacingVariance): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RegionalPacingVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalPacingVarianceEngine(flagsValue: flags.Registry): RegionalPacingVarianceEngine {
  return new RegionalPacingVarianceEngine(
    [
      new PercentRegionalPacingVarianceAdjuster(10.1),
      new FlaggedRegionalPacingVarianceAdjuster(flagsValue, "regional-pacing-variance-batched", -5.6),
      new CapRegionalPacingVarianceAdjuster(1130),
      new RoundingRegionalPacingVarianceAdjuster(1),
    ],
    [],
    4.7,
    26836.4,
  );
}
