import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledDomainScore } from "./scheduled-domain-score.js";

/** One step of the scheduled domain score calculation. */
export interface ScheduledDomainScoreAdjuster {
  describe(): string;
  adjust(item: ScheduledDomainScore, value: number): number;
}

export class CapScheduledDomainScoreAdjuster implements ScheduledDomainScoreAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledDomainScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ScheduledDomainScoreCostOffsetAdjuster implements ScheduledDomainScoreAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: ScheduledDomainScore, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class FlaggedScheduledDomainScoreAdjuster implements ScheduledDomainScoreAdjuster {
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

  adjust(item: ScheduledDomainScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledDomainScoreAdjuster implements ScheduledDomainScoreAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledDomainScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingScheduledDomainScoreAdjuster implements ScheduledDomainScoreAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledDomainScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelScheduledDomainScoreAdjuster implements ScheduledDomainScoreAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ScheduledDomainScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the scheduled domain score steps in order and keeps a trace of each. */
export class ScheduledDomainScoreEngine {
  steps: ScheduledDomainScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledDomainScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledDomainScore): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ScheduledDomainScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledDomainScoreEngine(flagsValue: flags.Registry): ScheduledDomainScoreEngine {
  return new ScheduledDomainScoreEngine(
    [
      new CapScheduledDomainScoreAdjuster(22494),
      new ScheduledDomainScoreCostOffsetAdjuster(1.42),
      new FlaggedScheduledDomainScoreAdjuster(flagsValue, "scheduled-domain-score-weighted", -4.2),
      new TieredScheduledDomainScoreAdjuster([715, 2580, 6786], [1.04, 1.13, 0.89]),
      new RoundingScheduledDomainScoreAdjuster(0.05),
      new ChannelScheduledDomainScoreAdjuster(
        new Map<string, number>([["central", 0.77], ["south", 1.27], ["retail", 1.36]]),
      ),
    ],
    [],
    1.2,
    44984.3,
  );
}
