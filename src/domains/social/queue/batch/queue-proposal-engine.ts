import * as numbers from "../../../../kit/numbers.js";
import { QueueProposal } from "./queue-proposal.js";

/** One step of the queue proposal calculation. */
export interface QueueProposalStep {
  describe(): string;
  adjust(item: QueueProposal, value: number): number;
}

export class MinimumQueueProposalAdjuster implements QueueProposalStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredQueueProposalAdjuster implements QueueProposalStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueueProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapQueueProposalAdjuster implements QueueProposalStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingQueueProposalAdjuster implements QueueProposalStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class QueueProposalExpiresAtOffsetAdjuster implements QueueProposalStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: QueueProposal, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class SourceQueueProposalAdjuster implements QueueProposalStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: QueueProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the queue proposal steps in order and keeps a trace of each. */
export class QueueProposalEngine {
  steps: QueueProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: QueueProposal): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: QueueProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultQueueProposalEngine(): QueueProposalEngine {
  return new QueueProposalEngine(
    [
      new MinimumQueueProposalAdjuster(37.4),
      new TieredQueueProposalAdjuster([1949, 3655, 8306, 8639], [0.94, 0.87, 1.08, 0.9]),
      new CapQueueProposalAdjuster(21064),
      new RoundingQueueProposalAdjuster(5),
      new QueueProposalExpiresAtOffsetAdjuster(0.58),
      new SourceQueueProposalAdjuster(
        new Map<string, number>([["south", 1.12], ["east", 1.1], ["retail", 1.16]]),
      ),
    ],
    [],
    4.4,
    9500,
  );
}
