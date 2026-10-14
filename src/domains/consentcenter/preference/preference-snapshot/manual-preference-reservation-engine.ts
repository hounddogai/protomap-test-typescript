import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualPreferenceReservation } from "./manual-preference-reservation.js";

/** One step of the manual preference reservation calculation. */
export interface ManualPreferenceReservationAdjuster {
  describe(): string;
  adjust(item: ManualPreferenceReservation, value: number): number;
}

export class TieredManualPreferenceReservationAdjuster implements ManualPreferenceReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualPreferenceReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelManualPreferenceReservationAdjuster implements ManualPreferenceReservationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ManualPreferenceReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedManualPreferenceReservationAdjuster implements ManualPreferenceReservationAdjuster {
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

  adjust(item: ManualPreferenceReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapManualPreferenceReservationAdjuster implements ManualPreferenceReservationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualPreferenceReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentManualPreferenceReservationAdjuster implements ManualPreferenceReservationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualPreferenceReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual preference reservation steps in order and keeps a trace of each. */
export class ManualPreferenceReservationEngine {
  steps: ManualPreferenceReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPreferenceReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualPreferenceReservation): number {
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

  evaluateAll(items: ManualPreferenceReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualPreferenceReservationEngine(flagsValue: flags.Registry): ManualPreferenceReservationEngine {
  return new ManualPreferenceReservationEngine(
    [
      new TieredManualPreferenceReservationAdjuster([5039, 9903], [0.87, 0.97]),
      new ChannelManualPreferenceReservationAdjuster(
        new Map<string, number>([["online", 0.76], ["south", 1.39]]),
      ),
      new FlaggedManualPreferenceReservationAdjuster(flagsValue, "manual-preference-reservation-manual", 0.7),
      new CapManualPreferenceReservationAdjuster(21639),
      new PercentManualPreferenceReservationAdjuster(13.7),
    ],
    [],
    1.3,
    27627.2,
  );
}
