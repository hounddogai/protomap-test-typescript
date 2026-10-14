import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewPlan } from "./ticket-view-plan.js";

/** One step of the ticket view plan calculation. */
export interface TicketViewPlanModifier {
  describe(): string;
  adjust(item: TicketViewPlan, value: number): number;
}

export class TieredTicketViewPlanAdjuster implements TicketViewPlanModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTicketViewPlanAdjuster implements TicketViewPlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTicketViewPlanAdjuster implements TicketViewPlanModifier {
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

  adjust(item: TicketViewPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionTicketViewPlanAdjuster implements TicketViewPlanModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: TicketViewPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the ticket view plan steps in order and keeps a trace of each. */
export class TicketViewPlanEngine {
  steps: TicketViewPlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewPlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TicketViewPlan): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: TicketViewPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTicketViewPlanEngine(flagsValue: flags.Registry): TicketViewPlanEngine {
  return new TicketViewPlanEngine(
    [
      new TieredTicketViewPlanAdjuster([17, 3731, 9149], [1.08, 1.11, 0.94]),
      new RoundingTicketViewPlanAdjuster(5),
      new FlaggedTicketViewPlanAdjuster(flagsValue, "ticket-view-plan-regional", 3.3),
      new RegionTicketViewPlanAdjuster(new Map<string, number>([["east", 0.92], ["west", 1.35]])),
    ],
    [],
    4.9,
    52920.7,
  );
}
