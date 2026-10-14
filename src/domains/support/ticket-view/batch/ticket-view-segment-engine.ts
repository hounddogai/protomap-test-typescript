import { TicketViewSegment } from "./ticket-view-segment.js";

/** One step of the ticket view segment calculation. */
export interface TicketViewSegmentModifier {
  describe(): string;
  adjust(item: TicketViewSegment, value: number): number;
}

export class TicketViewSegmentBatchSizeOffsetAdjuster implements TicketViewSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: TicketViewSegment, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class MinimumTicketViewSegmentAdjuster implements TicketViewSegmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TicketViewSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTicketViewSegmentAdjuster implements TicketViewSegmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the ticket view segment steps in order and keeps a trace of each. */
export class TicketViewSegmentEngine {
  steps: TicketViewSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewSegment): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: TicketViewSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewSegmentEngine(): TicketViewSegmentEngine {
  return new TicketViewSegmentEngine(
    [
      new TicketViewSegmentBatchSizeOffsetAdjuster(1.33),
      new MinimumTicketViewSegmentAdjuster(48.5),
      new TieredTicketViewSegmentAdjuster([2627, 6630], [1.12, 0.9]),
    ],
    [],
    3.4,
    71453.8,
  );
}
