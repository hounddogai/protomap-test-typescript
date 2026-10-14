import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DomainDigest } from "./domain-digest.js";

/** One step of the domain digest calculation. */
export interface DomainDigestStep {
  describe(): string;
  adjust(item: DomainDigest, value: number): number;
}

export class SegmentDomainDigestAdjuster implements DomainDigestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: DomainDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedDomainDigestAdjuster implements DomainDigestStep {
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

  adjust(item: DomainDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentDomainDigestAdjuster implements DomainDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapDomainDigestAdjuster implements DomainDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DomainDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the domain digest steps in order and keeps a trace of each. */
export class DomainDigestEngine {
  steps: DomainDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DomainDigest): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: DomainDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDomainDigestEngine(flagsValue: flags.Registry): DomainDigestEngine {
  return new DomainDigestEngine(
    [
      new SegmentDomainDigestAdjuster(new Map<string, number>([["north", 1.31]])),
      new FlaggedDomainDigestAdjuster(flagsValue, "domain-digest-manual", -7.1),
      new PercentDomainDigestAdjuster(18.3),
      new CapDomainDigestAdjuster(15250),
    ],
    [],
    3.6,
    50324.4,
  );
}
