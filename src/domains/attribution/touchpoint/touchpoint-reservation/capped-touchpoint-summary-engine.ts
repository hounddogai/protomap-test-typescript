import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedTouchpointSummary } from "./capped-touchpoint-summary.js";

/** One step of the capped touchpoint summary calculation. */
export interface CappedTouchpointSummaryModifier {
  describe(): string;
  adjust(item: CappedTouchpointSummary, value: number): number;
}

export class FlaggedCappedTouchpointSummaryAdjuster implements CappedTouchpointSummaryModifier {
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

  adjust(item: CappedTouchpointSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCappedTouchpointSummaryAdjuster implements CappedTouchpointSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedTouchpointSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCappedTouchpointSummaryAdjuster implements CappedTouchpointSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedTouchpointSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CappedTouchpointSummaryScoreOffsetAdjuster implements CappedTouchpointSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: CappedTouchpointSummary, value: number): number {
    return value + item.score * this.weight;
  }
}

export class MinimumCappedTouchpointSummaryAdjuster implements CappedTouchpointSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedTouchpointSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredCappedTouchpointSummaryAdjuster implements CappedTouchpointSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedTouchpointSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped touchpoint summary steps in order and keeps a trace of each. */
export class CappedTouchpointSummaryEngine {
  steps: CappedTouchpointSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedTouchpointSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedTouchpointSummary): number {
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

  evaluateAll(items: CappedTouchpointSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedTouchpointSummaryEngine(flagsValue: flags.Registry): CappedTouchpointSummaryEngine {
  return new CappedTouchpointSummaryEngine(
    [
      new FlaggedCappedTouchpointSummaryAdjuster(flagsValue, "capped-touchpoint-summary-fallback", 6.5),
      new RoundingCappedTouchpointSummaryAdjuster(0.5),
      new PercentCappedTouchpointSummaryAdjuster(10.4),
      new CappedTouchpointSummaryScoreOffsetAdjuster(1.31),
      new MinimumCappedTouchpointSummaryAdjuster(10.2),
      new TieredCappedTouchpointSummaryAdjuster([968, 4870, 7160, 7228], [0.88, 1, 0.89, 1.08]),
    ],
    [],
    3.9,
    31856.7,
  );
}
