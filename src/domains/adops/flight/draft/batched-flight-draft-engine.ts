import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedFlightDraft } from "./batched-flight-draft.js";

/** One step of the batched flight draft calculation. */
export interface BatchedFlightDraftModifier {
  describe(): string;
  adjust(item: BatchedFlightDraft, value: number): number;
}

export class BatchedFlightDraftBidOffsetAdjuster implements BatchedFlightDraftModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: BatchedFlightDraft, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class MinimumBatchedFlightDraftAdjuster implements BatchedFlightDraftModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedFlightDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UtmSourceBatchedFlightDraftAdjuster implements BatchedFlightDraftModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: BatchedFlightDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedBatchedFlightDraftAdjuster implements BatchedFlightDraftModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: BatchedFlightDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedFlightDraftAdjuster implements BatchedFlightDraftModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedFlightDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBatchedFlightDraftAdjuster implements BatchedFlightDraftModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedFlightDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched flight draft steps in order and keeps a trace of each. */
export class BatchedFlightDraftEngine {
  steps: BatchedFlightDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedFlightDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedFlightDraft): number {
    let current = item.netExposure();
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

  evaluateAll(items: BatchedFlightDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedFlightDraftEngine(flagsValue: flags.Registry): BatchedFlightDraftEngine {
  return new BatchedFlightDraftEngine(
    [
      new BatchedFlightDraftBidOffsetAdjuster(1.14),
      new MinimumBatchedFlightDraftAdjuster(45.5),
      new UtmSourceBatchedFlightDraftAdjuster(new Map<string, number>([["south", 1.29]])),
      new FlaggedBatchedFlightDraftAdjuster(flagsValue, "batched-flight-draft-manual", -7.5),
      new RoundingBatchedFlightDraftAdjuster(5),
      new PercentBatchedFlightDraftAdjuster(4.3),
    ],
    [],
    4.7,
    61318.7,
  );
}
