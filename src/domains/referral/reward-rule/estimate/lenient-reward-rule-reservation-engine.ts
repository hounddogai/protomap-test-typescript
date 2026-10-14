import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientRewardRuleReservation } from "./lenient-reward-rule-reservation.js";

/** One step of the lenient reward rule reservation calculation. */
export interface LenientRewardRuleReservationAdjuster {
  describe(): string;
  adjust(item: LenientRewardRuleReservation, value: number): number;
}

export class TieredLenientRewardRuleReservationAdjuster implements LenientRewardRuleReservationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientRewardRuleReservation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLenientRewardRuleReservationAdjuster implements LenientRewardRuleReservationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientRewardRuleReservation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameLenientRewardRuleReservationAdjuster implements LenientRewardRuleReservationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LenientRewardRuleReservation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLenientRewardRuleReservationAdjuster implements LenientRewardRuleReservationAdjuster {
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

  adjust(item: LenientRewardRuleReservation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientRewardRuleReservationAdjuster implements LenientRewardRuleReservationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientRewardRuleReservation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LenientRewardRuleReservationFloorValueOffsetAdjuster implements LenientRewardRuleReservationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: LenientRewardRuleReservation, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the lenient reward rule reservation steps in order and keeps a trace of each. */
export class LenientRewardRuleReservationEngine {
  steps: LenientRewardRuleReservationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientRewardRuleReservationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientRewardRuleReservation): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: LenientRewardRuleReservation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientRewardRuleReservationEngine(flagsValue: flags.Registry): LenientRewardRuleReservationEngine {
  return new LenientRewardRuleReservationEngine(
    [
      new TieredLenientRewardRuleReservationAdjuster([4883, 8023], [0.82, 1.05]),
      new PercentLenientRewardRuleReservationAdjuster(1.6),
      new NameLenientRewardRuleReservationAdjuster(new Map<string, number>([["retail", 0.73], ["north", 0.74]])),
      new FlaggedLenientRewardRuleReservationAdjuster(
        flagsValue,
        "lenient-reward-rule-reservation-global",
        -7.5,
      ),
      new RoundingLenientRewardRuleReservationAdjuster(0.25),
      new LenientRewardRuleReservationFloorValueOffsetAdjuster(1.45),
    ],
    [],
    3.3,
    36621.8,
  );
}
