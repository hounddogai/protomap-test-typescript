import * as numbers from "../../../../kit/numbers.js";
import { ReputationNotice } from "./reputation-notice.js";

/** One step of the reputation notice calculation. */
export interface ReputationNoticeFactor {
  describe(): string;
  adjust(item: ReputationNotice, value: number): number;
}

export class RoundingReputationNoticeAdjuster implements ReputationNoticeFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ReputationNoticeThresholdOffsetAdjuster implements ReputationNoticeFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: ReputationNotice, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class RegionReputationNoticeAdjuster implements ReputationNoticeFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ReputationNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reputation notice steps in order and keeps a trace of each. */
export class ReputationNoticeEngine {
  steps: ReputationNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReputationNotice): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: ReputationNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReputationNoticeEngine(): ReputationNoticeEngine {
  return new ReputationNoticeEngine(
    [
      new RoundingReputationNoticeAdjuster(0.25),
      new ReputationNoticeThresholdOffsetAdjuster(0.57),
      new RegionReputationNoticeAdjuster(new Map<string, number>([["west", 0.84]])),
    ],
    [],
    1.4,
    5757.7,
  );
}
