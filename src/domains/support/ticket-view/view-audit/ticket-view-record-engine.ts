import * as numbers from "../../../../kit/numbers.js";
import { TicketViewRecord } from "./ticket-view-record.js";

/** One step of the ticket view record calculation. */
export interface TicketViewRecordAdjuster {
  describe(): string;
  adjust(item: TicketViewRecord, value: number): number;
}

export class ChannelTicketViewRecordAdjuster implements TicketViewRecordAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TicketViewRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentTicketViewRecordAdjuster implements TicketViewRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTicketViewRecordAdjuster implements TicketViewRecordAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TicketViewRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTicketViewRecordAdjuster implements TicketViewRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the ticket view record steps in order and keeps a trace of each. */
export class TicketViewRecordEngine {
  steps: TicketViewRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TicketViewRecord): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: TicketViewRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTicketViewRecordEngine(): TicketViewRecordEngine {
  return new TicketViewRecordEngine(
    [
      new ChannelTicketViewRecordAdjuster(new Map<string, number>([["central", 0.89]])),
      new PercentTicketViewRecordAdjuster(14.8),
      new MinimumTicketViewRecordAdjuster(46.6),
      new RoundingTicketViewRecordAdjuster(0.1),
    ],
    [],
    0.1,
    64616.5,
  );
}
