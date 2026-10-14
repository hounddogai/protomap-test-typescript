import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultChallengeSlot } from "./default-challenge-slot.js";

/** One step of the default challenge slot calculation. */
export interface DefaultChallengeSlotStep {
  describe(): string;
  adjust(item: DefaultChallengeSlot, value: number): number;
}

export class RoundingDefaultChallengeSlotAdjuster implements DefaultChallengeSlotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultChallengeSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelDefaultChallengeSlotAdjuster implements DefaultChallengeSlotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: DefaultChallengeSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDefaultChallengeSlotAdjuster implements DefaultChallengeSlotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultChallengeSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedDefaultChallengeSlotAdjuster implements DefaultChallengeSlotStep {
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

  adjust(item: DefaultChallengeSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultChallengeSlotAdjuster implements DefaultChallengeSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultChallengeSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredDefaultChallengeSlotAdjuster implements DefaultChallengeSlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultChallengeSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default challenge slot steps in order and keeps a trace of each. */
export class DefaultChallengeSlotEngine {
  steps: DefaultChallengeSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultChallengeSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultChallengeSlot): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: DefaultChallengeSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultChallengeSlotEngine(flagsValue: flags.Registry): DefaultChallengeSlotEngine {
  return new DefaultChallengeSlotEngine(
    [
      new RoundingDefaultChallengeSlotAdjuster(0.05),
      new ChannelDefaultChallengeSlotAdjuster(new Map<string, number>([["central", 1.2], ["east", 0.87]])),
      new CapDefaultChallengeSlotAdjuster(16955),
      new FlaggedDefaultChallengeSlotAdjuster(flagsValue, "default-challenge-slot-primary", -3.3),
      new MinimumDefaultChallengeSlotAdjuster(21.3),
      new TieredDefaultChallengeSlotAdjuster([11, 3512, 4061, 4310], [1.07, 1.18, 1.06, 1.07]),
    ],
    [],
    3.1,
    62436.7,
  );
}
