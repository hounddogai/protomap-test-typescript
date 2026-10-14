import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualEscalationReview } from "./manual-escalation-review.js";

/** One step of the manual escalation review calculation. */
export interface ManualEscalationReviewFactor {
  describe(): string;
  adjust(item: ManualEscalationReview, value: number): number;
}

export class ManualEscalationReviewThresholdOffsetAdjuster implements ManualEscalationReviewFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: ManualEscalationReview, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CapManualEscalationReviewAdjuster implements ManualEscalationReviewFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualEscalationReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedManualEscalationReviewAdjuster implements ManualEscalationReviewFactor {
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

  adjust(item: ManualEscalationReview, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual escalation review steps in order and keeps a trace of each. */
export class ManualEscalationReviewEngine {
  steps: ManualEscalationReviewFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualEscalationReviewFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualEscalationReview): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ManualEscalationReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualEscalationReviewEngine(flagsValue: flags.Registry): ManualEscalationReviewEngine {
  return new ManualEscalationReviewEngine(
    [
      new ManualEscalationReviewThresholdOffsetAdjuster(1.99),
      new CapManualEscalationReviewAdjuster(26350),
      new FlaggedManualEscalationReviewAdjuster(flagsValue, "manual-escalation-review-manual", -5.4),
    ],
    [],
    0.4,
    66103.6,
  );
}
