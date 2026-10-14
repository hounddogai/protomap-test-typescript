import * as numbers from "../../../../kit/numbers.js";
import { TicketViewException } from "./ticket-view-exception.js";

/** One step of the ticket view exception calculation. */
export interface TicketViewExceptionFactor {
  describe(): string;
  adjust(item: TicketViewException, value: number): number;
}

export class TicketViewExceptionQuantityOffsetAdjuster implements TicketViewExceptionFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: TicketViewException, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class ChannelTicketViewExceptionAdjuster implements TicketViewExceptionFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TicketViewException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingTicketViewExceptionAdjuster implements TicketViewExceptionFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the ticket view exception steps in order and keeps a trace of each. */
export class TicketViewExceptionEngine {
  steps: TicketViewExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewException): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: TicketViewException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewExceptionEngine(): TicketViewExceptionEngine {
  return new TicketViewExceptionEngine(
    [
      new TicketViewExceptionQuantityOffsetAdjuster(0.91),
      new ChannelTicketViewExceptionAdjuster(new Map<string, number>([["online", 1.3]])),
      new RoundingTicketViewExceptionAdjuster(0.5),
    ],
    [],
    1,
    60542.8,
  );
}
