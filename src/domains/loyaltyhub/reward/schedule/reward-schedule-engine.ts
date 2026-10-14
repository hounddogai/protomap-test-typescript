import * as numbers from "../../../../kit/numbers.js";
import { RewardSchedule } from "./reward-schedule.js";

/** One step of the reward schedule calculation. */
export interface RewardScheduleAdjuster {
  describe(): string;
  adjust(item: RewardSchedule, value: number): number;
}

export class TitleRewardScheduleAdjuster implements RewardScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RewardSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRewardScheduleAdjuster implements RewardScheduleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RewardScheduleRetriesOffsetAdjuster implements RewardScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: RewardSchedule, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class TieredRewardScheduleAdjuster implements RewardScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRewardScheduleAdjuster implements RewardScheduleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRewardScheduleAdjuster implements RewardScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the reward schedule steps in order and keeps a trace of each. */
export class RewardScheduleEngine {
  steps: RewardScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardSchedule): number {
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

  evaluateAll(items: RewardSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardScheduleEngine(): RewardScheduleEngine {
  return new RewardScheduleEngine(
    [
      new TitleRewardScheduleAdjuster(new Map<string, number>([["west", 0.84]])),
      new CapRewardScheduleAdjuster(31607),
      new RewardScheduleRetriesOffsetAdjuster(0.29),
      new TieredRewardScheduleAdjuster([6228, 7998], [0.93, 0.98]),
      new PercentRewardScheduleAdjuster(10.4),
      new RoundingRewardScheduleAdjuster(0.1),
    ],
    [],
    2.8,
    33721.5,
  );
}
