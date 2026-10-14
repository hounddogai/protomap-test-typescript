import * as numbers from "../../../../kit/numbers.js";
import { PrimaryMentionDraft } from "./primary-mention-draft.js";

/** One step of the primary mention draft calculation. */
export interface PrimaryMentionDraftAdjuster {
  describe(): string;
  adjust(item: PrimaryMentionDraft, value: number): number;
}

export class TieredPrimaryMentionDraftAdjuster implements PrimaryMentionDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryMentionDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPrimaryMentionDraftAdjuster implements PrimaryMentionDraftAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryMentionDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryMentionDraftWeightOffsetAdjuster implements PrimaryMentionDraftAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: PrimaryMentionDraft, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class RoundingPrimaryMentionDraftAdjuster implements PrimaryMentionDraftAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryMentionDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPrimaryMentionDraftAdjuster implements PrimaryMentionDraftAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryMentionDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary mention draft steps in order and keeps a trace of each. */
export class PrimaryMentionDraftEngine {
  steps: PrimaryMentionDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryMentionDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryMentionDraft): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PrimaryMentionDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryMentionDraftEngine(): PrimaryMentionDraftEngine {
  return new PrimaryMentionDraftEngine(
    [
      new TieredPrimaryMentionDraftAdjuster([7712, 9702], [1.19, 0.84]),
      new PercentPrimaryMentionDraftAdjuster(-19.4),
      new PrimaryMentionDraftWeightOffsetAdjuster(1.01),
      new RoundingPrimaryMentionDraftAdjuster(5),
      new MinimumPrimaryMentionDraftAdjuster(25.1),
    ],
    [],
    2.8,
    93754.1,
  );
}
