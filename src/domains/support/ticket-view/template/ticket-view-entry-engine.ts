import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewEntry } from "./ticket-view-entry.js";

/** One step of the ticket view entry calculation. */
export interface TicketViewEntryFactor {
  describe(): string;
  adjust(item: TicketViewEntry, value: number): number;
}

export class TieredTicketViewEntryAdjuster implements TicketViewEntryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentTicketViewEntryAdjuster implements TicketViewEntryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTicketViewEntryAdjuster implements TicketViewEntryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTicketViewEntryAdjuster implements TicketViewEntryFactor {
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

  adjust(item: TicketViewEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the ticket view entry steps in order and keeps a trace of each. */
export class TicketViewEntryEngine {
  steps: TicketViewEntryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewEntryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewEntry): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: TicketViewEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewEntryEngine(flagsValue: flags.Registry): TicketViewEntryEngine {
  return new TicketViewEntryEngine(
    [
      new TieredTicketViewEntryAdjuster([2275, 3226], [0.85, 0.99]),
      new PercentTicketViewEntryAdjuster(-8.4),
      new RoundingTicketViewEntryAdjuster(0.1),
      new FlaggedTicketViewEntryAdjuster(flagsValue, "ticket-view-entry-default", -8.7),
    ],
    [],
    3.2,
    87743.9,
  );
}
