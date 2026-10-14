import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EscalationReservation } from "./escalation-reservation.js";

/** One step of the escalation reservation calculation. */
export interface EscalationReservationFactor {
  describe(): string;
  adjust(item: EscalationReservation, value: number): number;
}

export class TitleEscalationReservationAdjuster implements EscalationReservationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: EscalationReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class EscalationReservationBudgetOffsetAdjuster implements EscalationReservationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: EscalationReservation, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingEscalationReservationAdjuster implements EscalationReservationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapEscalationReservationAdjuster implements EscalationReservationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationReservation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedEscalationReservationAdjuster implements EscalationReservationFactor {
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

  adjust(item: EscalationReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the escalation reservation steps in order and keeps a trace of each. */
export class EscalationReservationEngine {
  steps: EscalationReservationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationReservationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: EscalationReservation): number {
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

  evaluateAll(items: EscalationReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultEscalationReservationEngine(flagsValue: flags.Registry): EscalationReservationEngine {
  return new EscalationReservationEngine(
    [
      new TitleEscalationReservationAdjuster(new Map<string, number>([["south", 0.85], ["central", 0.95]])),
      new EscalationReservationBudgetOffsetAdjuster(1.89),
      new RoundingEscalationReservationAdjuster(1),
      new CapEscalationReservationAdjuster(48260),
      new FlaggedEscalationReservationAdjuster(flagsValue, "escalation-reservation-global", -0.5),
    ],
    [],
    2,
    73296.4,
  );
}
