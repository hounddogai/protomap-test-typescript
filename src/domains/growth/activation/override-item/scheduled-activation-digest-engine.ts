import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledActivationDigest } from "./scheduled-activation-digest.js";

/** One step of the scheduled activation digest calculation. */
export interface ScheduledActivationDigestModifier {
  describe(): string;
  adjust(item: ScheduledActivationDigest, value: number): number;
}

export class FlaggedScheduledActivationDigestAdjuster implements ScheduledActivationDigestModifier {
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

  adjust(item: ScheduledActivationDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledActivationDigestImpressionsOffsetAdjuster implements ScheduledActivationDigestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: ScheduledActivationDigest, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class NameScheduledActivationDigestAdjuster implements ScheduledActivationDigestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ScheduledActivationDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumScheduledActivationDigestAdjuster implements ScheduledActivationDigestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledActivationDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentScheduledActivationDigestAdjuster implements ScheduledActivationDigestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledActivationDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledActivationDigestAdjuster implements ScheduledActivationDigestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledActivationDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled activation digest steps in order and keeps a trace of each. */
export class ScheduledActivationDigestEngine {
  steps: ScheduledActivationDigestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledActivationDigestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledActivationDigest): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ScheduledActivationDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledActivationDigestEngine(flagsValue: flags.Registry): ScheduledActivationDigestEngine {
  return new ScheduledActivationDigestEngine(
    [
      new FlaggedScheduledActivationDigestAdjuster(flagsValue, "scheduled-activation-digest-lenient", -9.6),
      new ScheduledActivationDigestImpressionsOffsetAdjuster(0.04),
      new NameScheduledActivationDigestAdjuster(new Map<string, number>([["central", 1.34]])),
      new MinimumScheduledActivationDigestAdjuster(29.1),
      new PercentScheduledActivationDigestAdjuster(4.4),
      new CapScheduledActivationDigestAdjuster(15177),
    ],
    [],
    4,
    74587.7,
  );
}
