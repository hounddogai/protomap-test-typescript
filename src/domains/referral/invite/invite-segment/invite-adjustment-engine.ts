import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InviteAdjustment } from "./invite-adjustment.js";

/** One step of the invite adjustment calculation. */
export interface InviteAdjustmentModifier {
  describe(): string;
  adjust(item: InviteAdjustment, value: number): number;
}

export class CapInviteAdjustmentAdjuster implements InviteAdjustmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredInviteAdjustmentAdjuster implements InviteAdjustmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingInviteAdjustmentAdjuster implements InviteAdjustmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumInviteAdjustmentAdjuster implements InviteAdjustmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class InviteAdjustmentSendAtOffsetAdjuster implements InviteAdjustmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: InviteAdjustment, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class FlaggedInviteAdjustmentAdjuster implements InviteAdjustmentModifier {
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

  adjust(item: InviteAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the invite adjustment steps in order and keeps a trace of each. */
export class InviteAdjustmentEngine {
  steps: InviteAdjustmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteAdjustmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InviteAdjustment): number {
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

  evaluateAll(items: InviteAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInviteAdjustmentEngine(flagsValue: flags.Registry): InviteAdjustmentEngine {
  return new InviteAdjustmentEngine(
    [
      new CapInviteAdjustmentAdjuster(46814),
      new TieredInviteAdjustmentAdjuster([29, 331, 5360, 8990], [0.98, 1.09, 1.17, 0.8]),
      new RoundingInviteAdjustmentAdjuster(5),
      new MinimumInviteAdjustmentAdjuster(39.1),
      new InviteAdjustmentSendAtOffsetAdjuster(1.18),
      new FlaggedInviteAdjustmentAdjuster(flagsValue, "invite-adjustment-adaptive", 1.4),
    ],
    [],
    2.5,
    96198.1,
  );
}
