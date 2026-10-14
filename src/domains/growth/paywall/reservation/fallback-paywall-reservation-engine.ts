import * as flags from "../../../../kit/flags.js";
import { FallbackPaywallReservation } from "./fallback-paywall-reservation.js";

/** One step of the fallback paywall reservation calculation. */
export interface FallbackPaywallReservationModifier {
  describe(): string;
  adjust(item: FallbackPaywallReservation, value: number): number;
}

export class TieredFallbackPaywallReservationAdjuster implements FallbackPaywallReservationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackPaywallReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentFallbackPaywallReservationAdjuster implements FallbackPaywallReservationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackPaywallReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedFallbackPaywallReservationAdjuster implements FallbackPaywallReservationModifier {
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

  adjust(item: FallbackPaywallReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback paywall reservation steps in order and keeps a trace of each. */
export class FallbackPaywallReservationEngine {
  steps: FallbackPaywallReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPaywallReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackPaywallReservation): number {
    let current = item.effectiveValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: FallbackPaywallReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackPaywallReservationEngine(flagsValue: flags.Registry): FallbackPaywallReservationEngine {
  return new FallbackPaywallReservationEngine(
    [
      new TieredFallbackPaywallReservationAdjuster([7609, 9823, 9891], [0.94, 1, 1.12]),
      new PercentFallbackPaywallReservationAdjuster(-9.3),
      new FlaggedFallbackPaywallReservationAdjuster(flagsValue, "fallback-paywall-reservation-strict", -6.9),
    ],
    [],
    1.9,
    86850,
  );
}
