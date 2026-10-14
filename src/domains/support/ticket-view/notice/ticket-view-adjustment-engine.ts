import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewAdjustment } from "./ticket-view-adjustment.js";

/** One step of the ticket view adjustment calculation. */
export interface TicketViewAdjustmentAdjuster {
  describe(): string;
  adjust(item: TicketViewAdjustment, value: number): number;
}

export class TieredTicketViewAdjustmentAdjuster implements TicketViewAdjustmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedTicketViewAdjustmentAdjuster implements TicketViewAdjustmentAdjuster {
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

  adjust(item: TicketViewAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TicketViewAdjustmentDurationMinutesOffsetAdjuster implements TicketViewAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: TicketViewAdjustment, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class PercentTicketViewAdjustmentAdjuster implements TicketViewAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTicketViewAdjustmentAdjuster implements TicketViewAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTicketViewAdjustmentAdjuster implements TicketViewAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TicketViewAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the ticket view adjustment steps in order and keeps a trace of each. */
export class TicketViewAdjustmentEngine {
  steps: TicketViewAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TicketViewAdjustment): number {
    let current = item.netTotal();
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

  evaluateAll(items: TicketViewAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTicketViewAdjustmentEngine(flagsValue: flags.Registry): TicketViewAdjustmentEngine {
  return new TicketViewAdjustmentEngine(
    [
      new TieredTicketViewAdjustmentAdjuster([841, 7229], [1.15, 0.92]),
      new FlaggedTicketViewAdjustmentAdjuster(flagsValue, "ticket-view-adjustment-rolling", -1.7),
      new TicketViewAdjustmentDurationMinutesOffsetAdjuster(1.49),
      new PercentTicketViewAdjustmentAdjuster(0.6),
      new RoundingTicketViewAdjustmentAdjuster(1),
      new CapTicketViewAdjustmentAdjuster(41845),
    ],
    [],
    4.6,
    12066,
  );
}
