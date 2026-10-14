import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPostOverride } from "./default-post-override.js";

/** One step of the default post override calculation. */
export interface DefaultPostOverrideStep {
  describe(): string;
  adjust(item: DefaultPostOverride, value: number): number;
}

export class FlaggedDefaultPostOverrideAdjuster implements DefaultPostOverrideStep {
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

  adjust(item: DefaultPostOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDefaultPostOverrideAdjuster implements DefaultPostOverrideStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultPostOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDefaultPostOverrideAdjuster implements DefaultPostOverrideStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultPostOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapDefaultPostOverrideAdjuster implements DefaultPostOverrideStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultPostOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleDefaultPostOverrideAdjuster implements DefaultPostOverrideStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: DefaultPostOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class DefaultPostOverrideOpenRateOffsetAdjuster implements DefaultPostOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: DefaultPostOverride, value: number): number {
    return value + item.openRate * this.weight;
  }
}

/** Runs the default post override steps in order and keeps a trace of each. */
export class DefaultPostOverrideEngine {
  steps: DefaultPostOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPostOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultPostOverride): number {
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

  evaluateAll(items: DefaultPostOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultPostOverrideEngine(flagsValue: flags.Registry): DefaultPostOverrideEngine {
  return new DefaultPostOverrideEngine(
    [
      new FlaggedDefaultPostOverrideAdjuster(flagsValue, "default-post-override-regional", -5.4),
      new PercentDefaultPostOverrideAdjuster(10.3),
      new RoundingDefaultPostOverrideAdjuster(0.5),
      new CapDefaultPostOverrideAdjuster(8041),
      new LocaleDefaultPostOverrideAdjuster(new Map<string, number>([["north", 1.36], ["central", 1.37]])),
      new DefaultPostOverrideOpenRateOffsetAdjuster(1.62),
    ],
    [],
    0.7,
    93564.5,
  );
}
