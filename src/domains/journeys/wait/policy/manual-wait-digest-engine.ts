import * as numbers from "../../../../kit/numbers.js";
import { ManualWaitDigest } from "./manual-wait-digest.js";

/** One step of the manual wait digest calculation. */
export interface ManualWaitDigestFactor {
  describe(): string;
  adjust(item: ManualWaitDigest, value: number): number;
}

export class LocaleManualWaitDigestAdjuster implements ManualWaitDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ManualWaitDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentManualWaitDigestAdjuster implements ManualWaitDigestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualWaitDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualWaitDigestAdjuster implements ManualWaitDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualWaitDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingManualWaitDigestAdjuster implements ManualWaitDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualWaitDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual wait digest steps in order and keeps a trace of each. */
export class ManualWaitDigestEngine {
  steps: ManualWaitDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualWaitDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualWaitDigest): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ManualWaitDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualWaitDigestEngine(): ManualWaitDigestEngine {
  return new ManualWaitDigestEngine(
    [
      new LocaleManualWaitDigestAdjuster(new Map<string, number>([["north", 1.04]])),
      new PercentManualWaitDigestAdjuster(-22.8),
      new MinimumManualWaitDigestAdjuster(12.7),
      new RoundingManualWaitDigestAdjuster(1),
    ],
    [],
    0.9,
    65854,
  );
}
