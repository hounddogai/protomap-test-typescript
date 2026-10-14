import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleReservation } from "./reward-rule-reservation.js";

/** One step of the reward rule reservation calculation. */
export interface RewardRuleReservationAdjuster {
  describe(): string;
  adjust(item: RewardRuleReservation, value: number): number;
}

export class CapRewardRuleReservationAdjuster implements RewardRuleReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRewardRuleReservationAdjuster implements RewardRuleReservationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRewardRuleReservationAdjuster implements RewardRuleReservationAdjuster {
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

  adjust(item: RewardRuleReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRewardRuleReservationAdjuster implements RewardRuleReservationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRewardRuleReservationAdjuster implements RewardRuleReservationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRewardRuleReservationAdjuster implements RewardRuleReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reward rule reservation steps in order and keeps a trace of each. */
export class RewardRuleReservationEngine {
  steps: RewardRuleReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleReservation): number {
    let current = item.weightedValue();
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

  evaluateAll(items: RewardRuleReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleReservationEngine(flagsValue: flags.Registry): RewardRuleReservationEngine {
  return new RewardRuleReservationEngine(
    [
      new CapRewardRuleReservationAdjuster(49036),
      new PercentRewardRuleReservationAdjuster(-0.9),
      new FlaggedRewardRuleReservationAdjuster(flagsValue, "reward-rule-reservation-scheduled", -3.4),
      new RoundingRewardRuleReservationAdjuster(5),
      new MinimumRewardRuleReservationAdjuster(41),
      new TieredRewardRuleReservationAdjuster([279, 2316, 2502, 4057], [0.99, 1.08, 1.08, 1.01]),
    ],
    [],
    2.8,
    74975.1,
  );
}
