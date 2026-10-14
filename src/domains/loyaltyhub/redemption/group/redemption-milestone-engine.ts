import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RedemptionMilestone } from "./redemption-milestone.js";

/** One step of the redemption milestone calculation. */
export interface RedemptionMilestoneModifier {
  describe(): string;
  adjust(item: RedemptionMilestone, value: number): number;
}

export class FlaggedRedemptionMilestoneAdjuster implements RedemptionMilestoneModifier {
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

  adjust(item: RedemptionMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelRedemptionMilestoneAdjuster implements RedemptionMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RedemptionMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RedemptionMilestoneCeilingOffsetAdjuster implements RedemptionMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: RedemptionMilestone, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingRedemptionMilestoneAdjuster implements RedemptionMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RedemptionMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRedemptionMilestoneAdjuster implements RedemptionMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRedemptionMilestoneAdjuster implements RedemptionMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the redemption milestone steps in order and keeps a trace of each. */
export class RedemptionMilestoneEngine {
  steps: RedemptionMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RedemptionMilestone): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: RedemptionMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRedemptionMilestoneEngine(flagsValue: flags.Registry): RedemptionMilestoneEngine {
  return new RedemptionMilestoneEngine(
    [
      new FlaggedRedemptionMilestoneAdjuster(flagsValue, "redemption-milestone-pending", -1.2),
      new ChannelRedemptionMilestoneAdjuster(new Map<string, number>([["online", 1.25], ["south", 0.75]])),
      new RedemptionMilestoneCeilingOffsetAdjuster(0.91),
      new RoundingRedemptionMilestoneAdjuster(0.25),
      new MinimumRedemptionMilestoneAdjuster(19.4),
      new CapRedemptionMilestoneAdjuster(3644),
    ],
    [],
    1.2,
    95852.4,
  );
}
