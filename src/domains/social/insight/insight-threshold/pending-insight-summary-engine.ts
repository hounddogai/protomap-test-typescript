import * as numbers from "../../../../kit/numbers.js";
import { PendingInsightSummary } from "./pending-insight-summary.js";

/** One step of the pending insight summary calculation. */
export interface PendingInsightSummaryStep {
  describe(): string;
  adjust(item: PendingInsightSummary, value: number): number;
}

export class PercentPendingInsightSummaryAdjuster implements PendingInsightSummaryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingInsightSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocalePendingInsightSummaryAdjuster implements PendingInsightSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PendingInsightSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPendingInsightSummaryAdjuster implements PendingInsightSummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingInsightSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPendingInsightSummaryAdjuster implements PendingInsightSummaryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingInsightSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPendingInsightSummaryAdjuster implements PendingInsightSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingInsightSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PendingInsightSummaryFrequencyCapOffsetAdjuster implements PendingInsightSummaryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: PendingInsightSummary, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

/** Runs the pending insight summary steps in order and keeps a trace of each. */
export class PendingInsightSummaryEngine {
  steps: PendingInsightSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingInsightSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingInsightSummary): number {
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

  evaluateAll(items: PendingInsightSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingInsightSummaryEngine(): PendingInsightSummaryEngine {
  return new PendingInsightSummaryEngine(
    [
      new PercentPendingInsightSummaryAdjuster(-19.5),
      new LocalePendingInsightSummaryAdjuster(new Map<string, number>([["retail", 1.27], ["central", 0.71]])),
      new MinimumPendingInsightSummaryAdjuster(3.3),
      new CapPendingInsightSummaryAdjuster(24047),
      new RoundingPendingInsightSummaryAdjuster(0.05),
      new PendingInsightSummaryFrequencyCapOffsetAdjuster(0.77),
    ],
    [],
    4.5,
    68159.8,
  );
}
