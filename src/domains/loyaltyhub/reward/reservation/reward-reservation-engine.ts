import * as numbers from "../../../../kit/numbers.js";
import { RewardReservation } from "./reward-reservation.js";

/** One step of the reward reservation calculation. */
export interface RewardReservationModifier {
  describe(): string;
  adjust(item: RewardReservation, value: number): number;
}

export class CapRewardReservationAdjuster implements RewardReservationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRewardReservationAdjuster implements RewardReservationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRewardReservationAdjuster implements RewardReservationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRewardReservationAdjuster implements RewardReservationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRewardReservationAdjuster implements RewardReservationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameRewardReservationAdjuster implements RewardReservationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RewardReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reward reservation steps in order and keeps a trace of each. */
export class RewardReservationEngine {
  steps: RewardReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardReservation): number {
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

  evaluateAll(items: RewardReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardReservationEngine(): RewardReservationEngine {
  return new RewardReservationEngine(
    [
      new CapRewardReservationAdjuster(47906),
      new MinimumRewardReservationAdjuster(0.5),
      new TieredRewardReservationAdjuster([7490, 9889], [1, 0.87]),
      new RoundingRewardReservationAdjuster(0.25),
      new PercentRewardReservationAdjuster(22.9),
      new NameRewardReservationAdjuster(new Map<string, number>([["online", 1.03], ["east", 1.04]])),
    ],
    [],
    4.8,
    64562,
  );
}
