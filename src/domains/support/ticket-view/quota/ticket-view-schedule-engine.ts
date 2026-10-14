import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewSchedule } from "./ticket-view-schedule.js";

/** One step of the ticket view schedule calculation. */
export interface TicketViewScheduleAdjuster {
  describe(): string;
  adjust(item: TicketViewSchedule, value: number): number;
}

export class RoundingTicketViewScheduleAdjuster implements TicketViewScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelTicketViewScheduleAdjuster implements TicketViewScheduleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TicketViewSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTicketViewScheduleAdjuster implements TicketViewScheduleAdjuster {
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

  adjust(item: TicketViewSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTicketViewScheduleAdjuster implements TicketViewScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentTicketViewScheduleAdjuster implements TicketViewScheduleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the ticket view schedule steps in order and keeps a trace of each. */
export class TicketViewScheduleEngine {
  steps: TicketViewScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TicketViewSchedule): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TicketViewSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTicketViewScheduleEngine(flagsValue: flags.Registry): TicketViewScheduleEngine {
  return new TicketViewScheduleEngine(
    [
      new RoundingTicketViewScheduleAdjuster(0.1),
      new LabelTicketViewScheduleAdjuster(new Map<string, number>([["north", 0.85]])),
      new FlaggedTicketViewScheduleAdjuster(flagsValue, "ticket-view-schedule-batched", 5.2),
      new TieredTicketViewScheduleAdjuster([2652, 4637, 7627], [1.06, 0.94, 1.13]),
      new PercentTicketViewScheduleAdjuster(-7.5),
    ],
    [],
    3.8,
    11432.7,
  );
}
