import * as numbers from "../../../../kit/numbers.js";
import { TouchpointProposal } from "./touchpoint-proposal.js";

/** One step of the touchpoint proposal calculation. */
export interface TouchpointProposalAdjuster {
  describe(): string;
  adjust(item: TouchpointProposal, value: number): number;
}

export class TieredTouchpointProposalAdjuster implements TouchpointProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TouchpointProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTouchpointProposalAdjuster implements TouchpointProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TouchpointProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TouchpointProposalBatchSizeOffsetAdjuster implements TouchpointProposalAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: TouchpointProposal, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class ChannelTouchpointProposalAdjuster implements TouchpointProposalAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TouchpointProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingTouchpointProposalAdjuster implements TouchpointProposalAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TouchpointProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the touchpoint proposal steps in order and keeps a trace of each. */
export class TouchpointProposalEngine {
  steps: TouchpointProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TouchpointProposal): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: TouchpointProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTouchpointProposalEngine(): TouchpointProposalEngine {
  return new TouchpointProposalEngine(
    [
      new TieredTouchpointProposalAdjuster([5601, 8388], [1.11, 1]),
      new MinimumTouchpointProposalAdjuster(29.3),
      new TouchpointProposalBatchSizeOffsetAdjuster(1.5),
      new ChannelTouchpointProposalAdjuster(
        new Map<string, number>([["online", 1.28], ["retail", 0.78], ["west", 1.2]]),
      ),
      new RoundingTouchpointProposalAdjuster(0.25),
    ],
    [],
    2.1,
    39332.4,
  );
}
