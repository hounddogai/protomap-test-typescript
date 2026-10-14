import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingWindowTarget } from "./rolling-window-target.js";

/** One step of the rolling window target calculation. */
export interface RollingWindowTargetModifier {
  describe(): string;
  adjust(item: RollingWindowTarget, value: number): number;
}

export class PercentRollingWindowTargetAdjuster implements RollingWindowTargetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingWindowTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingWindowTargetAdjuster implements RollingWindowTargetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingWindowTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleRollingWindowTargetAdjuster implements RollingWindowTargetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RollingWindowTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRollingWindowTargetAdjuster implements RollingWindowTargetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingWindowTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRollingWindowTargetAdjuster implements RollingWindowTargetModifier {
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

  adjust(item: RollingWindowTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingWindowTargetAdjuster implements RollingWindowTargetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingWindowTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the rolling window target steps in order and keeps a trace of each. */
export class RollingWindowTargetEngine {
  steps: RollingWindowTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingWindowTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingWindowTarget): number {
    let current = item.weightedValue();
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

  evaluateAll(items: RollingWindowTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingWindowTargetEngine(flagsValue: flags.Registry): RollingWindowTargetEngine {
  return new RollingWindowTargetEngine(
    [
      new PercentRollingWindowTargetAdjuster(-2.2),
      new CapRollingWindowTargetAdjuster(27544),
      new TitleRollingWindowTargetAdjuster(new Map<string, number>([["online", 0.99]])),
      new TieredRollingWindowTargetAdjuster([6513, 6529], [0.96, 0.97]),
      new FlaggedRollingWindowTargetAdjuster(flagsValue, "rolling-window-target-default", 5.7),
      new RoundingRollingWindowTargetAdjuster(0.1),
    ],
    [],
    2.4,
    45703.2,
  );
}
