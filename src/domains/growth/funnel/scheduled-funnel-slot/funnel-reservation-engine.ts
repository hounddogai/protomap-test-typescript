import * as numbers from "../../../../kit/numbers.js";
import { FunnelReservation } from "./funnel-reservation.js";

/** One step of the funnel reservation calculation. */
export interface FunnelReservationStep {
  describe(): string;
  adjust(item: FunnelReservation, value: number): number;
}

export class ChannelFunnelReservationAdjuster implements FunnelReservationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FunnelReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FunnelReservationAmountOffsetAdjuster implements FunnelReservationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: FunnelReservation, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class RoundingFunnelReservationAdjuster implements FunnelReservationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumFunnelReservationAdjuster implements FunnelReservationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFunnelReservationAdjuster implements FunnelReservationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the funnel reservation steps in order and keeps a trace of each. */
export class FunnelReservationEngine {
  steps: FunnelReservationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelReservationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FunnelReservation): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: FunnelReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFunnelReservationEngine(): FunnelReservationEngine {
  return new FunnelReservationEngine(
    [
      new ChannelFunnelReservationAdjuster(
        new Map<string, number>([["south", 0.82], ["west", 0.9], ["retail", 1.32]]),
      ),
      new FunnelReservationAmountOffsetAdjuster(1.84),
      new RoundingFunnelReservationAdjuster(1),
      new MinimumFunnelReservationAdjuster(32.6),
      new PercentFunnelReservationAdjuster(20),
    ],
    [],
    3.6,
    45376.5,
  );
}
