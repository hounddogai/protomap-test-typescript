import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacySubscriptionMilestone } from "./legacy-subscription-milestone.js";

/** One step of the legacy subscription milestone calculation. */
export interface LegacySubscriptionMilestoneModifier {
  describe(): string;
  adjust(item: LegacySubscriptionMilestone, value: number): number;
}

export class FlaggedLegacySubscriptionMilestoneAdjuster implements LegacySubscriptionMilestoneModifier {
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

  adjust(item: LegacySubscriptionMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLegacySubscriptionMilestoneAdjuster implements LegacySubscriptionMilestoneModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacySubscriptionMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLegacySubscriptionMilestoneAdjuster implements LegacySubscriptionMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacySubscriptionMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourceLegacySubscriptionMilestoneAdjuster implements LegacySubscriptionMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: LegacySubscriptionMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy subscription milestone steps in order and keeps a trace of each. */
export class LegacySubscriptionMilestoneEngine {
  steps: LegacySubscriptionMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacySubscriptionMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacySubscriptionMilestone): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: LegacySubscriptionMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacySubscriptionMilestoneEngine(flagsValue: flags.Registry): LegacySubscriptionMilestoneEngine {
  return new LegacySubscriptionMilestoneEngine(
    [
      new FlaggedLegacySubscriptionMilestoneAdjuster(flagsValue, "legacy-subscription-milestone-fallback", 3.1),
      new TieredLegacySubscriptionMilestoneAdjuster([3803, 6740], [1.03, 0.96]),
      new RoundingLegacySubscriptionMilestoneAdjuster(5),
      new SourceLegacySubscriptionMilestoneAdjuster(
        new Map<string, number>([["central", 0.91], ["west", 0.94]]),
      ),
    ],
    [],
    3.4,
    27123.4,
  );
}
