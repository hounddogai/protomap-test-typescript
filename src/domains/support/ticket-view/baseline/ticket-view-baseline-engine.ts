import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewBaseline } from "./ticket-view-baseline.js";

/** One step of the ticket view baseline calculation. */
export interface TicketViewBaselineStep {
  describe(): string;
  adjust(item: TicketViewBaseline, value: number): number;
}

export class TieredTicketViewBaselineAdjuster implements TicketViewBaselineStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapTicketViewBaselineAdjuster implements TicketViewBaselineStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TicketViewBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTicketViewBaselineAdjuster implements TicketViewBaselineStep {
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

  adjust(item: TicketViewBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TicketViewBaselineCostOffsetAdjuster implements TicketViewBaselineStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: TicketViewBaseline, value: number): number {
    return value + item.cost * this.weight;
  }
}

/** Runs the ticket view baseline steps in order and keeps a trace of each. */
export class TicketViewBaselineEngine {
  steps: TicketViewBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TicketViewBaseline): number {
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

  evaluateAll(items: TicketViewBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTicketViewBaselineEngine(flagsValue: flags.Registry): TicketViewBaselineEngine {
  return new TicketViewBaselineEngine(
    [
      new TieredTicketViewBaselineAdjuster([3131, 4095, 9385], [1.11, 1.03, 1.17]),
      new CapTicketViewBaselineAdjuster(2910),
      new FlaggedTicketViewBaselineAdjuster(flagsValue, "ticket-view-baseline-legacy", -0.6),
      new TicketViewBaselineCostOffsetAdjuster(0.32),
    ],
    [],
    3.4,
    50194.3,
  );
}
