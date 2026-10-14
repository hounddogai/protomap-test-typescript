import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyCsatMilestone } from "./legacy-csat-milestone.js";

/** One step of the legacy csat milestone calculation. */
export interface LegacyCsatMilestoneModifier {
  describe(): string;
  adjust(item: LegacyCsatMilestone, value: number): number;
}

export class RoundingLegacyCsatMilestoneAdjuster implements LegacyCsatMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyCsatMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLegacyCsatMilestoneAdjuster implements LegacyCsatMilestoneModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyCsatMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LegacyCsatMilestoneGraceDaysOffsetAdjuster implements LegacyCsatMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: LegacyCsatMilestone, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class ChannelLegacyCsatMilestoneAdjuster implements LegacyCsatMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LegacyCsatMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLegacyCsatMilestoneAdjuster implements LegacyCsatMilestoneModifier {
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

  adjust(item: LegacyCsatMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyCsatMilestoneAdjuster implements LegacyCsatMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyCsatMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy csat milestone steps in order and keeps a trace of each. */
export class LegacyCsatMilestoneEngine {
  steps: LegacyCsatMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyCsatMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyCsatMilestone): number {
    let current = item.netExposure();
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

  evaluateAll(items: LegacyCsatMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyCsatMilestoneEngine(flagsValue: flags.Registry): LegacyCsatMilestoneEngine {
  return new LegacyCsatMilestoneEngine(
    [
      new RoundingLegacyCsatMilestoneAdjuster(5),
      new PercentLegacyCsatMilestoneAdjuster(-7.2),
      new LegacyCsatMilestoneGraceDaysOffsetAdjuster(1.73),
      new ChannelLegacyCsatMilestoneAdjuster(new Map<string, number>([["online", 0.87], ["west", 1.08]])),
      new FlaggedLegacyCsatMilestoneAdjuster(flagsValue, "legacy-csat-milestone-seasonal", 5.1),
      new CapLegacyCsatMilestoneAdjuster(49666),
    ],
    [],
    3.6,
    49497.4,
  );
}
