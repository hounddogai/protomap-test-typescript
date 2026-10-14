import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InvitePlan } from "./invite-plan.js";

/** One step of the invite plan calculation. */
export interface InvitePlanModifier {
  describe(): string;
  adjust(item: InvitePlan, value: number): number;
}

export class MinimumInvitePlanAdjuster implements InvitePlanModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InvitePlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitInvitePlanAdjuster implements InvitePlanModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: InvitePlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapInvitePlanAdjuster implements InvitePlanModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InvitePlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedInvitePlanAdjuster implements InvitePlanModifier {
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

  adjust(item: InvitePlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingInvitePlanAdjuster implements InvitePlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InvitePlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the invite plan steps in order and keeps a trace of each. */
export class InvitePlanEngine {
  steps: InvitePlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InvitePlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InvitePlan): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: InvitePlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInvitePlanEngine(flagsValue: flags.Registry): InvitePlanEngine {
  return new InvitePlanEngine(
    [
      new MinimumInvitePlanAdjuster(8),
      new UnitInvitePlanAdjuster(new Map<string, number>([["central", 1.16], ["west", 0.7]])),
      new CapInvitePlanAdjuster(31032),
      new FlaggedInvitePlanAdjuster(flagsValue, "invite-plan-adaptive", 5.3),
      new RoundingInvitePlanAdjuster(5),
    ],
    [],
    4.2,
    95792.2,
  );
}
