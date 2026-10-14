import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingDomainDigest } from "./pending-domain-digest.js";

/** One step of the pending domain digest calculation. */
export interface PendingDomainDigestStep {
  describe(): string;
  adjust(item: PendingDomainDigest, value: number): number;
}

export class CapPendingDomainDigestAdjuster implements PendingDomainDigestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingDomainDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingDomainDigestAdjuster implements PendingDomainDigestStep {
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

  adjust(item: PendingDomainDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingDomainDigestAdjuster implements PendingDomainDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingDomainDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPendingDomainDigestAdjuster implements PendingDomainDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingDomainDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPendingDomainDigestAdjuster implements PendingDomainDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingDomainDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPendingDomainDigestAdjuster implements PendingDomainDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingDomainDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending domain digest steps in order and keeps a trace of each. */
export class PendingDomainDigestEngine {
  steps: PendingDomainDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingDomainDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingDomainDigest): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: PendingDomainDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingDomainDigestEngine(flagsValue: flags.Registry): PendingDomainDigestEngine {
  return new PendingDomainDigestEngine(
    [
      new CapPendingDomainDigestAdjuster(30393),
      new FlaggedPendingDomainDigestAdjuster(flagsValue, "pending-domain-digest-adaptive", -2.2),
      new MinimumPendingDomainDigestAdjuster(21.3),
      new RoundingPendingDomainDigestAdjuster(0.05),
      new PercentPendingDomainDigestAdjuster(5.5),
      new TieredPendingDomainDigestAdjuster([348, 2080, 4946, 9428], [1.12, 1.2, 1.2, 1.12]),
    ],
    [],
    4.2,
    83512.8,
  );
}
