import * as flags from "../../../../kit/flags.js";
import { DomainTarget } from "./domain-target.js";

/** One step of the domain target calculation. */
export interface DomainTargetFactor {
  describe(): string;
  adjust(item: DomainTarget, value: number): number;
}

export class TieredDomainTargetAdjuster implements DomainTargetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentDomainTargetAdjuster implements DomainTargetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedDomainTargetAdjuster implements DomainTargetFactor {
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

  adjust(item: DomainTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the domain target steps in order and keeps a trace of each. */
export class DomainTargetEngine {
  steps: DomainTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DomainTarget): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: DomainTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDomainTargetEngine(flagsValue: flags.Registry): DomainTargetEngine {
  return new DomainTargetEngine(
    [
      new TieredDomainTargetAdjuster([1032, 5439, 5971, 8679], [0.99, 1.14, 0.83, 1.13]),
      new PercentDomainTargetAdjuster(-18.4),
      new FlaggedDomainTargetAdjuster(flagsValue, "domain-target-legacy", -1.8),
    ],
    [],
    1.4,
    19050.7,
  );
}
