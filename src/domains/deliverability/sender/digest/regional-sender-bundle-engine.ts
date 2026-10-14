import * as numbers from "../../../../kit/numbers.js";
import { RegionalSenderBundle } from "./regional-sender-bundle.js";

/** One step of the regional sender bundle calculation. */
export interface RegionalSenderBundleAdjuster {
  describe(): string;
  adjust(item: RegionalSenderBundle, value: number): number;
}

export class SourceRegionalSenderBundleAdjuster implements RegionalSenderBundleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: RegionalSenderBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRegionalSenderBundleAdjuster implements RegionalSenderBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalSenderBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRegionalSenderBundleAdjuster implements RegionalSenderBundleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalSenderBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional sender bundle steps in order and keeps a trace of each. */
export class RegionalSenderBundleEngine {
  steps: RegionalSenderBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalSenderBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalSenderBundle): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RegionalSenderBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalSenderBundleEngine(): RegionalSenderBundleEngine {
  return new RegionalSenderBundleEngine(
    [
      new SourceRegionalSenderBundleAdjuster(
        new Map<string, number>([["central", 1.04], ["retail", 1.29], ["south", 1.18]]),
      ),
      new CapRegionalSenderBundleAdjuster(39479),
      new RoundingRegionalSenderBundleAdjuster(0.25),
    ],
    [],
    3.8,
    75576.2,
  );
}
