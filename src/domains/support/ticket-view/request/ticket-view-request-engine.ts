import * as numbers from "../../../../kit/numbers.js";
import { TicketViewRequest } from "./ticket-view-request.js";

/** One step of the ticket view request calculation. */
export interface TicketViewRequestModifier {
  describe(): string;
  adjust(item: TicketViewRequest, value: number): number;
}

export class PercentTicketViewRequestAdjuster implements TicketViewRequestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTicketViewRequestAdjuster implements TicketViewRequestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TicketViewRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTicketViewRequestAdjuster implements TicketViewRequestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TicketViewRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TicketViewRequestQuantityOffsetAdjuster implements TicketViewRequestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: TicketViewRequest, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the ticket view request steps in order and keeps a trace of each. */
export class TicketViewRequestEngine {
  steps: TicketViewRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewRequest): number {
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

  evaluateAll(items: TicketViewRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewRequestEngine(): TicketViewRequestEngine {
  return new TicketViewRequestEngine(
    [
      new PercentTicketViewRequestAdjuster(20.3),
      new CapTicketViewRequestAdjuster(41515),
      new MinimumTicketViewRequestAdjuster(6.2),
      new TicketViewRequestQuantityOffsetAdjuster(0.67),
    ],
    [],
    1.2,
    26281.9,
  );
}
