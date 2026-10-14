import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualTicketViewTier } from "./manual-ticket-view-tier.js";

/** One step of the manual ticket view tier calculation. */
export interface ManualTicketViewTierModifier {
  describe(): string;
  adjust(item: ManualTicketViewTier, value: number): number;
}

export class PercentManualTicketViewTierAdjuster implements ManualTicketViewTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualTicketViewTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualTicketViewTierAdjuster implements ManualTicketViewTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualTicketViewTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingManualTicketViewTierAdjuster implements ManualTicketViewTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualTicketViewTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedManualTicketViewTierAdjuster implements ManualTicketViewTierModifier {
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

  adjust(item: ManualTicketViewTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ManualTicketViewTierEndsAtOffsetAdjuster implements ManualTicketViewTierModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: ManualTicketViewTier, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the manual ticket view tier steps in order and keeps a trace of each. */
export class ManualTicketViewTierEngine {
  steps: ManualTicketViewTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTicketViewTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualTicketViewTier): number {
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

  evaluateAll(items: ManualTicketViewTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualTicketViewTierEngine(flagsValue: flags.Registry): ManualTicketViewTierEngine {
  return new ManualTicketViewTierEngine(
    [
      new PercentManualTicketViewTierAdjuster(2.1),
      new MinimumManualTicketViewTierAdjuster(18.1),
      new RoundingManualTicketViewTierAdjuster(5),
      new FlaggedManualTicketViewTierAdjuster(flagsValue, "manual-ticket-view-tier-adaptive", 9.4),
      new ManualTicketViewTierEndsAtOffsetAdjuster(0.04),
    ],
    [],
    1.8,
    82868.8,
  );
}
