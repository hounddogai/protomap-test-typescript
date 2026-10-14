import * as numbers from "../../../../kit/numbers.js";
import { FallbackSenderReservation } from "./fallback-sender-reservation.js";

/** One step of the fallback sender reservation calculation. */
export interface FallbackSenderReservationAdjuster {
  describe(): string;
  adjust(item: FallbackSenderReservation, value: number): number;
}

export class RoundingFallbackSenderReservationAdjuster implements FallbackSenderReservationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackSenderReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelFallbackSenderReservationAdjuster implements FallbackSenderReservationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FallbackSenderReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapFallbackSenderReservationAdjuster implements FallbackSenderReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackSenderReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback sender reservation steps in order and keeps a trace of each. */
export class FallbackSenderReservationEngine {
  steps: FallbackSenderReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackSenderReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackSenderReservation): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: FallbackSenderReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackSenderReservationEngine(): FallbackSenderReservationEngine {
  return new FallbackSenderReservationEngine(
    [
      new RoundingFallbackSenderReservationAdjuster(5),
      new ChannelFallbackSenderReservationAdjuster(new Map<string, number>([["north", 1.2], ["online", 1.33]])),
      new CapFallbackSenderReservationAdjuster(6162),
    ],
    [],
    0.4,
    74684.1,
  );
}
