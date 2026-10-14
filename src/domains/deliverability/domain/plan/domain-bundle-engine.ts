import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DomainBundle } from "./domain-bundle.js";

/** One step of the domain bundle calculation. */
export interface DomainBundleStep {
  describe(): string;
  adjust(item: DomainBundle, value: number): number;
}

export class PercentDomainBundleAdjuster implements DomainBundleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedDomainBundleAdjuster implements DomainBundleStep {
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

  adjust(item: DomainBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDomainBundleAdjuster implements DomainBundleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DomainBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumDomainBundleAdjuster implements DomainBundleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DomainBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the domain bundle steps in order and keeps a trace of each. */
export class DomainBundleEngine {
  steps: DomainBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DomainBundle): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: DomainBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDomainBundleEngine(flagsValue: flags.Registry): DomainBundleEngine {
  return new DomainBundleEngine(
    [
      new PercentDomainBundleAdjuster(15.8),
      new FlaggedDomainBundleAdjuster(flagsValue, "domain-bundle-pending", 7.5),
      new RoundingDomainBundleAdjuster(5),
      new MinimumDomainBundleAdjuster(32.3),
    ],
    [],
    3.1,
    57706.4,
  );
}
