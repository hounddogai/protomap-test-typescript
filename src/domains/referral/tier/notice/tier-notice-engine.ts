import { TierNotice } from "./tier-notice.js";

/** One step of the tier notice calculation. */
export interface TierNoticeStep {
  describe(): string;
  adjust(item: TierNotice, value: number): number;
}

export class TierNoticeMaximumOffsetAdjuster implements TierNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: TierNotice, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class PercentTierNoticeAdjuster implements TierNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTierNoticeAdjuster implements TierNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tier notice steps in order and keeps a trace of each. */
export class TierNoticeEngine {
  steps: TierNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TierNotice): number {
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

  evaluateAll(items: TierNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTierNoticeEngine(): TierNoticeEngine {
  return new TierNoticeEngine(
    [
      new TierNoticeMaximumOffsetAdjuster(0.53),
      new PercentTierNoticeAdjuster(3.8),
      new MinimumTierNoticeAdjuster(36.8),
    ],
    [],
    2.3,
    16285.6,
  );
}
