import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledWaitBundle } from "./scheduled-wait-bundle.js";

/** One step of the scheduled wait bundle calculation. */
export interface ScheduledWaitBundleModifier {
  describe(): string;
  adjust(item: ScheduledWaitBundle, value: number): number;
}

export class TitleScheduledWaitBundleAdjuster implements ScheduledWaitBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ScheduledWaitBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedScheduledWaitBundleAdjuster implements ScheduledWaitBundleModifier {
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

  adjust(item: ScheduledWaitBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledWaitBundleAdjuster implements ScheduledWaitBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledWaitBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingScheduledWaitBundleAdjuster implements ScheduledWaitBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledWaitBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapScheduledWaitBundleAdjuster implements ScheduledWaitBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledWaitBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentScheduledWaitBundleAdjuster implements ScheduledWaitBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledWaitBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled wait bundle steps in order and keeps a trace of each. */
export class ScheduledWaitBundleEngine {
  steps: ScheduledWaitBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledWaitBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledWaitBundle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ScheduledWaitBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledWaitBundleEngine(flagsValue: flags.Registry): ScheduledWaitBundleEngine {
  return new ScheduledWaitBundleEngine(
    [
      new TitleScheduledWaitBundleAdjuster(new Map<string, number>([["central", 0.93]])),
      new FlaggedScheduledWaitBundleAdjuster(flagsValue, "scheduled-wait-bundle-pending", -1.5),
      new TieredScheduledWaitBundleAdjuster([5216, 9472], [0.91, 1.11]),
      new RoundingScheduledWaitBundleAdjuster(0.5),
      new CapScheduledWaitBundleAdjuster(17516),
      new PercentScheduledWaitBundleAdjuster(23),
    ],
    [],
    1.4,
    69824.7,
  );
}
