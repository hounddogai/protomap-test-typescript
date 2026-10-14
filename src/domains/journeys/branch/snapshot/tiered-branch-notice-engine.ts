import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredBranchNotice } from "./tiered-branch-notice.js";

/** One step of the tiered branch notice calculation. */
export interface TieredBranchNoticeAdjuster {
  describe(): string;
  adjust(item: TieredBranchNotice, value: number): number;
}

export class TieredTieredBranchNoticeAdjuster implements TieredBranchNoticeAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredBranchNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedTieredBranchNoticeAdjuster implements TieredBranchNoticeAdjuster {
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

  adjust(item: TieredBranchNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTieredBranchNoticeAdjuster implements TieredBranchNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredBranchNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTieredBranchNoticeAdjuster implements TieredBranchNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredBranchNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentTieredBranchNoticeAdjuster implements TieredBranchNoticeAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: TieredBranchNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentTieredBranchNoticeAdjuster implements TieredBranchNoticeAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredBranchNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered branch notice steps in order and keeps a trace of each. */
export class TieredBranchNoticeEngine {
  steps: TieredBranchNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBranchNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredBranchNotice): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: TieredBranchNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredBranchNoticeEngine(flagsValue: flags.Registry): TieredBranchNoticeEngine {
  return new TieredBranchNoticeEngine(
    [
      new TieredTieredBranchNoticeAdjuster([4117, 5571, 5725, 7095], [1.18, 0.96, 0.98, 1.05]),
      new FlaggedTieredBranchNoticeAdjuster(flagsValue, "tiered-branch-notice-rolling", -8.7),
      new RoundingTieredBranchNoticeAdjuster(0.25),
      new MinimumTieredBranchNoticeAdjuster(32.6),
      new SegmentTieredBranchNoticeAdjuster(
        new Map<string, number>([["west", 0.95], ["online", 1.11], ["retail", 1.31]]),
      ),
      new PercentTieredBranchNoticeAdjuster(-0.7),
    ],
    [],
    1.1,
    87218.8,
  );
}
