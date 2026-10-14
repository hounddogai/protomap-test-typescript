import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RetentionMilestone } from "./retention-milestone.js";

/** One step of the retention milestone calculation. */
export interface RetentionMilestoneModifier {
  describe(): string;
  adjust(item: RetentionMilestone, value: number): number;
}

export class PercentRetentionMilestoneAdjuster implements RetentionMilestoneModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SegmentRetentionMilestoneAdjuster implements RetentionMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: RetentionMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRetentionMilestoneAdjuster implements RetentionMilestoneModifier {
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

  adjust(item: RetentionMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRetentionMilestoneAdjuster implements RetentionMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RetentionMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRetentionMilestoneAdjuster implements RetentionMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the retention milestone steps in order and keeps a trace of each. */
export class RetentionMilestoneEngine {
  steps: RetentionMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RetentionMilestone): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: RetentionMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRetentionMilestoneEngine(flagsValue: flags.Registry): RetentionMilestoneEngine {
  return new RetentionMilestoneEngine(
    [
      new PercentRetentionMilestoneAdjuster(-19.2),
      new SegmentRetentionMilestoneAdjuster(new Map<string, number>([["retail", 1.28]])),
      new FlaggedRetentionMilestoneAdjuster(flagsValue, "retention-milestone-manual", 6),
      new RoundingRetentionMilestoneAdjuster(5),
      new CapRetentionMilestoneAdjuster(4009),
    ],
    [],
    1,
    63767.5,
  );
}
