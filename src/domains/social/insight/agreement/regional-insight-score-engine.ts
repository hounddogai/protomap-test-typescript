import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalInsightScore } from "./regional-insight-score.js";

/** One step of the regional insight score calculation. */
export interface RegionalInsightScoreFactor {
  describe(): string;
  adjust(item: RegionalInsightScore, value: number): number;
}

export class TieredRegionalInsightScoreAdjuster implements RegionalInsightScoreFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalInsightScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRegionalInsightScoreAdjuster implements RegionalInsightScoreFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalInsightScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRegionalInsightScoreAdjuster implements RegionalInsightScoreFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalInsightScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRegionalInsightScoreAdjuster implements RegionalInsightScoreFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalInsightScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelRegionalInsightScoreAdjuster implements RegionalInsightScoreFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalInsightScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRegionalInsightScoreAdjuster implements RegionalInsightScoreFactor {
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

  adjust(item: RegionalInsightScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional insight score steps in order and keeps a trace of each. */
export class RegionalInsightScoreEngine {
  steps: RegionalInsightScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalInsightScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalInsightScore): number {
    let current = item.netTotal();
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

  evaluateAll(items: RegionalInsightScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalInsightScoreEngine(flagsValue: flags.Registry): RegionalInsightScoreEngine {
  return new RegionalInsightScoreEngine(
    [
      new TieredRegionalInsightScoreAdjuster([808, 2968, 9930], [0.84, 0.9, 0.96]),
      new MinimumRegionalInsightScoreAdjuster(24.6),
      new CapRegionalInsightScoreAdjuster(16574),
      new PercentRegionalInsightScoreAdjuster(10.1),
      new LabelRegionalInsightScoreAdjuster(new Map<string, number>([["north", 1.28], ["retail", 1.26]])),
      new FlaggedRegionalInsightScoreAdjuster(flagsValue, "regional-insight-score-scheduled", -2.1),
    ],
    [],
    3.9,
    39091.8,
  );
}
