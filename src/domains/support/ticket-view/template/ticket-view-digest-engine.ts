import * as numbers from "../../../../kit/numbers.js";
import { TicketViewDigest } from "./ticket-view-digest.js";

/** One step of the ticket view digest calculation. */
export interface TicketViewDigestStep {
  describe(): string;
  adjust(item: TicketViewDigest, value: number): number;
}

export class PercentTicketViewDigestAdjuster implements TicketViewDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTicketViewDigestAdjuster implements TicketViewDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TicketViewDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TicketViewDigestWeightOffsetAdjuster implements TicketViewDigestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: TicketViewDigest, value: number): number {
    return value + item.weight * this.weight;
  }
}

/** Runs the ticket view digest steps in order and keeps a trace of each. */
export class TicketViewDigestEngine {
  steps: TicketViewDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewDigest): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TicketViewDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewDigestEngine(): TicketViewDigestEngine {
  return new TicketViewDigestEngine(
    [
      new PercentTicketViewDigestAdjuster(-2.1),
      new CapTicketViewDigestAdjuster(40524),
      new TicketViewDigestWeightOffsetAdjuster(1.85),
    ],
    [],
    0.9,
    33229.2,
  );
}
