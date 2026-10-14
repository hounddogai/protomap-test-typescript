import * as numbers from "../../../../kit/numbers.js";
import { PendingLeaderboardOverride } from "./pending-leaderboard-override.js";

/** One step of the pending leaderboard override calculation. */
export interface PendingLeaderboardOverrideStep {
  describe(): string;
  adjust(item: PendingLeaderboardOverride, value: number): number;
}

export class PendingLeaderboardOverrideDurationMinutesOffsetAdjuster implements PendingLeaderboardOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: PendingLeaderboardOverride, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class RoundingPendingLeaderboardOverrideAdjuster implements PendingLeaderboardOverrideStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingLeaderboardOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelPendingLeaderboardOverrideAdjuster implements PendingLeaderboardOverrideStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PendingLeaderboardOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPendingLeaderboardOverrideAdjuster implements PendingLeaderboardOverrideStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingLeaderboardOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingLeaderboardOverrideAdjuster implements PendingLeaderboardOverrideStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingLeaderboardOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending leaderboard override steps in order and keeps a trace of each. */
export class PendingLeaderboardOverrideEngine {
  steps: PendingLeaderboardOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingLeaderboardOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingLeaderboardOverride): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PendingLeaderboardOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingLeaderboardOverrideEngine(): PendingLeaderboardOverrideEngine {
  return new PendingLeaderboardOverrideEngine(
    [
      new PendingLeaderboardOverrideDurationMinutesOffsetAdjuster(1.94),
      new RoundingPendingLeaderboardOverrideAdjuster(0.25),
      new LabelPendingLeaderboardOverrideAdjuster(
        new Map<string, number>([["online", 1.3], ["central", 0.84], ["east", 1.03]]),
      ),
      new CapPendingLeaderboardOverrideAdjuster(20144),
      new TieredPendingLeaderboardOverrideAdjuster([2951, 5655], [0.89, 1.05]),
    ],
    [],
    2.1,
    31399.9,
  );
}
