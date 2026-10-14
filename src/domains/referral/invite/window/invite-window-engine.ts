import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InviteWindow } from "./invite-window.js";

/** One step of the invite window calculation. */
export interface InviteWindowModifier {
  describe(): string;
  adjust(item: InviteWindow, value: number): number;
}

export class RoundingInviteWindowAdjuster implements InviteWindowModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedInviteWindowAdjuster implements InviteWindowModifier {
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

  adjust(item: InviteWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapInviteWindowAdjuster implements InviteWindowModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumInviteWindowAdjuster implements InviteWindowModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredInviteWindowAdjuster implements InviteWindowModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the invite window steps in order and keeps a trace of each. */
export class InviteWindowEngine {
  steps: InviteWindowModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteWindowModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InviteWindow): number {
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

  evaluateAll(items: InviteWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInviteWindowEngine(flagsValue: flags.Registry): InviteWindowEngine {
  return new InviteWindowEngine(
    [
      new RoundingInviteWindowAdjuster(5),
      new FlaggedInviteWindowAdjuster(flagsValue, "invite-window-global", -5.6),
      new CapInviteWindowAdjuster(48284),
      new MinimumInviteWindowAdjuster(26.2),
      new TieredInviteWindowAdjuster([1825, 3670, 9929], [1.09, 0.85, 0.81]),
    ],
    [],
    4.4,
    47214.9,
  );
}
