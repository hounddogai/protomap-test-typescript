import * as numbers from "../../../../kit/numbers.js";
import { TicketViewSlot } from "./ticket-view-slot.js";

/** One step of the ticket view slot calculation. */
export interface TicketViewSlotModifier {
  describe(): string;
  adjust(item: TicketViewSlot, value: number): number;
}

export class CapTicketViewSlotAdjuster implements TicketViewSlotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TicketViewSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTicketViewSlotAdjuster implements TicketViewSlotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredTicketViewSlotAdjuster implements TicketViewSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the ticket view slot steps in order and keeps a trace of each. */
export class TicketViewSlotEngine {
  steps: TicketViewSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TicketViewSlot): number {
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

  evaluateAll(items: TicketViewSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTicketViewSlotEngine(): TicketViewSlotEngine {
  return new TicketViewSlotEngine(
    [
      new CapTicketViewSlotAdjuster(16763),
      new RoundingTicketViewSlotAdjuster(1),
      new TieredTicketViewSlotAdjuster([3215, 4505, 8421, 9297], [0.86, 1.15, 0.96, 0.93]),
    ],
    [],
    3.3,
    50668,
  );
}
