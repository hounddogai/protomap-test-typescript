import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveEscalationReservation } from "./adaptive-escalation-reservation.js";

/** One step of the adaptive escalation reservation calculation. */
export interface AdaptiveEscalationReservationModifier {
  describe(): string;
  adjust(item: AdaptiveEscalationReservation, value: number): number;
}

export class CapAdaptiveEscalationReservationAdjuster implements AdaptiveEscalationReservationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveEscalationReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveEscalationReservationAdjuster implements AdaptiveEscalationReservationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveEscalationReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingAdaptiveEscalationReservationAdjuster implements AdaptiveEscalationReservationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveEscalationReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedAdaptiveEscalationReservationAdjuster implements AdaptiveEscalationReservationModifier {
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

  adjust(item: AdaptiveEscalationReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive escalation reservation steps in order and keeps a trace of each. */
export class AdaptiveEscalationReservationEngine {
  steps: AdaptiveEscalationReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveEscalationReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveEscalationReservation): number {
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

  evaluateAll(items: AdaptiveEscalationReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveEscalationReservationEngine(flagsValue: flags.Registry): AdaptiveEscalationReservationEngine {
  return new AdaptiveEscalationReservationEngine(
    [
      new CapAdaptiveEscalationReservationAdjuster(12172),
      new MinimumAdaptiveEscalationReservationAdjuster(12.8),
      new RoundingAdaptiveEscalationReservationAdjuster(0.05),
      new FlaggedAdaptiveEscalationReservationAdjuster(
        flagsValue,
        "adaptive-escalation-reservation-lenient",
        -7.2,
      ),
    ],
    [],
    4.7,
    60907.1,
  );
}
