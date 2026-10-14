import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalStepOverride } from "./regional-step-override.js";

/** One step of the regional step override calculation. */
export interface RegionalStepOverrideModifier {
  describe(): string;
  adjust(item: RegionalStepOverride, value: number): number;
}

export class MinimumRegionalStepOverrideAdjuster implements RegionalStepOverrideModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalStepOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRegionalStepOverrideAdjuster implements RegionalStepOverrideModifier {
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

  adjust(item: RegionalStepOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionalStepOverrideRetriesOffsetAdjuster implements RegionalStepOverrideModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: RegionalStepOverride, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class LabelRegionalStepOverrideAdjuster implements RegionalStepOverrideModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RegionalStepOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRegionalStepOverrideAdjuster implements RegionalStepOverrideModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalStepOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional step override steps in order and keeps a trace of each. */
export class RegionalStepOverrideEngine {
  steps: RegionalStepOverrideModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalStepOverrideModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalStepOverride): number {
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

  evaluateAll(items: RegionalStepOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalStepOverrideEngine(flagsValue: flags.Registry): RegionalStepOverrideEngine {
  return new RegionalStepOverrideEngine(
    [
      new MinimumRegionalStepOverrideAdjuster(8.1),
      new FlaggedRegionalStepOverrideAdjuster(flagsValue, "regional-step-override-weighted", -2.4),
      new RegionalStepOverrideRetriesOffsetAdjuster(1.53),
      new LabelRegionalStepOverrideAdjuster(new Map<string, number>([["online", 1], ["north", 0.88]])),
      new CapRegionalStepOverrideAdjuster(32865),
    ],
    [],
    4.2,
    88430.2,
  );
}
