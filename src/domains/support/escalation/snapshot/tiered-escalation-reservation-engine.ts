import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredEscalationReservation } from "./tiered-escalation-reservation.js";

/** One step of the tiered escalation reservation calculation. */
export interface TieredEscalationReservationModifier {
  describe(): string;
  adjust(item: TieredEscalationReservation, value: number): number;
}

export class UtmSourceTieredEscalationReservationAdjuster implements TieredEscalationReservationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: TieredEscalationReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTieredEscalationReservationAdjuster implements TieredEscalationReservationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredEscalationReservation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedTieredEscalationReservationAdjuster implements TieredEscalationReservationModifier {
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

  adjust(item: TieredEscalationReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered escalation reservation steps in order and keeps a trace of each. */
export class TieredEscalationReservationEngine {
  steps: TieredEscalationReservationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredEscalationReservationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredEscalationReservation): number {
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

  evaluateAll(items: TieredEscalationReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredEscalationReservationEngine(flagsValue: flags.Registry): TieredEscalationReservationEngine {
  return new TieredEscalationReservationEngine(
    [
      new UtmSourceTieredEscalationReservationAdjuster(new Map<string, number>([["online", 1.01]])),
      new MinimumTieredEscalationReservationAdjuster(31.6),
      new FlaggedTieredEscalationReservationAdjuster(flagsValue, "tiered-escalation-reservation-batched", 5.5),
    ],
    [],
    2.4,
    39843.1,
  );
}
