import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyFunnelMilestone } from "./legacy-funnel-milestone.js";

/** One step of the legacy funnel milestone calculation. */
export interface LegacyFunnelMilestoneModifier {
  describe(): string;
  adjust(item: LegacyFunnelMilestone, value: number): number;
}

export class UnitLegacyFunnelMilestoneAdjuster implements LegacyFunnelMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: LegacyFunnelMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLegacyFunnelMilestoneAdjuster implements LegacyFunnelMilestoneModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyFunnelMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedLegacyFunnelMilestoneAdjuster implements LegacyFunnelMilestoneModifier {
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

  adjust(item: LegacyFunnelMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacyFunnelMilestoneAdjuster implements LegacyFunnelMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyFunnelMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLegacyFunnelMilestoneAdjuster implements LegacyFunnelMilestoneModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyFunnelMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LegacyFunnelMilestoneRetriesOffsetAdjuster implements LegacyFunnelMilestoneModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: LegacyFunnelMilestone, value: number): number {
    return value + item.retries * this.weight;
  }
}

/** Runs the legacy funnel milestone steps in order and keeps a trace of each. */
export class LegacyFunnelMilestoneEngine {
  steps: LegacyFunnelMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyFunnelMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyFunnelMilestone): number {
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

  evaluateAll(items: LegacyFunnelMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyFunnelMilestoneEngine(flagsValue: flags.Registry): LegacyFunnelMilestoneEngine {
  return new LegacyFunnelMilestoneEngine(
    [
      new UnitLegacyFunnelMilestoneAdjuster(new Map<string, number>([["retail", 1.25]])),
      new CapLegacyFunnelMilestoneAdjuster(21242),
      new FlaggedLegacyFunnelMilestoneAdjuster(flagsValue, "legacy-funnel-milestone-capped", -5.7),
      new RoundingLegacyFunnelMilestoneAdjuster(0.5),
      new PercentLegacyFunnelMilestoneAdjuster(10.3),
      new LegacyFunnelMilestoneRetriesOffsetAdjuster(0.88),
    ],
    [],
    2.1,
    68580.8,
  );
}
