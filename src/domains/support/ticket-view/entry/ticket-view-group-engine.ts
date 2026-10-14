import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewGroup } from "./ticket-view-group.js";

/** One step of the ticket view group calculation. */
export interface TicketViewGroupModifier {
  describe(): string;
  adjust(item: TicketViewGroup, value: number): number;
}

export class MinimumTicketViewGroupAdjuster implements TicketViewGroupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TicketViewGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTicketViewGroupAdjuster implements TicketViewGroupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTicketViewGroupAdjuster implements TicketViewGroupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapTicketViewGroupAdjuster implements TicketViewGroupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TicketViewGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTicketViewGroupAdjuster implements TicketViewGroupModifier {
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

  adjust(item: TicketViewGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTicketViewGroupAdjuster implements TicketViewGroupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the ticket view group steps in order and keeps a trace of each. */
export class TicketViewGroupEngine {
  steps: TicketViewGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewGroup): number {
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

  evaluateAll(items: TicketViewGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewGroupEngine(flagsValue: flags.Registry): TicketViewGroupEngine {
  return new TicketViewGroupEngine(
    [
      new MinimumTicketViewGroupAdjuster(36.9),
      new PercentTicketViewGroupAdjuster(23.2),
      new TieredTicketViewGroupAdjuster([142, 1178, 5863, 7065], [0.99, 1.13, 1.09, 1.13]),
      new CapTicketViewGroupAdjuster(17749),
      new FlaggedTicketViewGroupAdjuster(flagsValue, "ticket-view-group-capped", -2.2),
      new RoundingTicketViewGroupAdjuster(1),
    ],
    [],
    3.9,
    7139.1,
  );
}
