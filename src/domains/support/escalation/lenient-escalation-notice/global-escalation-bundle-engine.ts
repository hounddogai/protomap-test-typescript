import * as flags from "../../../../kit/flags.js";
import { GlobalEscalationBundle } from "./global-escalation-bundle.js";

/** One step of the global escalation bundle calculation. */
export interface GlobalEscalationBundleModifier {
  describe(): string;
  adjust(item: GlobalEscalationBundle, value: number): number;
}

export class CapGlobalEscalationBundleAdjuster implements GlobalEscalationBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalEscalationBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelGlobalEscalationBundleAdjuster implements GlobalEscalationBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: GlobalEscalationBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class GlobalEscalationBundleRateOffsetAdjuster implements GlobalEscalationBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: GlobalEscalationBundle, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class MinimumGlobalEscalationBundleAdjuster implements GlobalEscalationBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalEscalationBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentGlobalEscalationBundleAdjuster implements GlobalEscalationBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalEscalationBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalEscalationBundleAdjuster implements GlobalEscalationBundleModifier {
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

  adjust(item: GlobalEscalationBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global escalation bundle steps in order and keeps a trace of each. */
export class GlobalEscalationBundleEngine {
  steps: GlobalEscalationBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalEscalationBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalEscalationBundle): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: GlobalEscalationBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalEscalationBundleEngine(flagsValue: flags.Registry): GlobalEscalationBundleEngine {
  return new GlobalEscalationBundleEngine(
    [
      new CapGlobalEscalationBundleAdjuster(37701),
      new ChannelGlobalEscalationBundleAdjuster(new Map<string, number>([["central", 0.77], ["east", 1.08]])),
      new GlobalEscalationBundleRateOffsetAdjuster(0.85),
      new MinimumGlobalEscalationBundleAdjuster(5),
      new PercentGlobalEscalationBundleAdjuster(20.9),
      new FlaggedGlobalEscalationBundleAdjuster(flagsValue, "global-escalation-bundle-seasonal", -5.9),
    ],
    [],
    0.7,
    6811.1,
  );
}
