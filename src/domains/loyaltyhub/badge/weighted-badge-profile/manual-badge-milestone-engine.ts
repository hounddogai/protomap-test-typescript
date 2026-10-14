import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualBadgeMilestone } from "./manual-badge-milestone.js";

/** One step of the manual badge milestone calculation. */
export interface ManualBadgeMilestoneModifier {
  describe(): string;
  adjust(item: ManualBadgeMilestone, value: number): number;
}

export class RoundingManualBadgeMilestoneAdjuster implements ManualBadgeMilestoneModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualBadgeMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedManualBadgeMilestoneAdjuster implements ManualBadgeMilestoneModifier {
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

  adjust(item: ManualBadgeMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameManualBadgeMilestoneAdjuster implements ManualBadgeMilestoneModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ManualBadgeMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumManualBadgeMilestoneAdjuster implements ManualBadgeMilestoneModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualBadgeMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentManualBadgeMilestoneAdjuster implements ManualBadgeMilestoneModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualBadgeMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual badge milestone steps in order and keeps a trace of each. */
export class ManualBadgeMilestoneEngine {
  steps: ManualBadgeMilestoneModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualBadgeMilestoneModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualBadgeMilestone): number {
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

  evaluateAll(items: ManualBadgeMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualBadgeMilestoneEngine(flagsValue: flags.Registry): ManualBadgeMilestoneEngine {
  return new ManualBadgeMilestoneEngine(
    [
      new RoundingManualBadgeMilestoneAdjuster(1),
      new FlaggedManualBadgeMilestoneAdjuster(flagsValue, "manual-badge-milestone-primary", -9.3),
      new NameManualBadgeMilestoneAdjuster(new Map<string, number>([["north", 0.75], ["west", 1.07]])),
      new MinimumManualBadgeMilestoneAdjuster(8.5),
      new PercentManualBadgeMilestoneAdjuster(-8),
    ],
    [],
    3.6,
    51281.8,
  );
}
