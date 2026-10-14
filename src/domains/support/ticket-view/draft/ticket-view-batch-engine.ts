import * as numbers from "../../../../kit/numbers.js";
import { TicketViewBatch } from "./ticket-view-batch.js";

/** One step of the ticket view batch calculation. */
export interface TicketViewBatchAdjuster {
  describe(): string;
  adjust(item: TicketViewBatch, value: number): number;
}

export class SegmentTicketViewBatchAdjuster implements TicketViewBatchAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: TicketViewBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTicketViewBatchAdjuster implements TicketViewBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TicketViewBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TicketViewBatchBatchSizeOffsetAdjuster implements TicketViewBatchAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: TicketViewBatch, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class TieredTicketViewBatchAdjuster implements TicketViewBatchAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTicketViewBatchAdjuster implements TicketViewBatchAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the ticket view batch steps in order and keeps a trace of each. */
export class TicketViewBatchEngine {
  steps: TicketViewBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TicketViewBatch): number {
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

  evaluateAll(items: TicketViewBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTicketViewBatchEngine(): TicketViewBatchEngine {
  return new TicketViewBatchEngine(
    [
      new SegmentTicketViewBatchAdjuster(
        new Map<string, number>([["online", 0.81], ["retail", 0.89], ["east", 0.88]]),
      ),
      new CapTicketViewBatchAdjuster(39187),
      new TicketViewBatchBatchSizeOffsetAdjuster(1.65),
      new TieredTicketViewBatchAdjuster([157, 3613, 8871], [0.89, 1.01, 0.91]),
      new RoundingTicketViewBatchAdjuster(0.1),
    ],
    [],
    1.3,
    75027.8,
  );
}
