import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingBranchManifest } from "./pending-branch-manifest.js";

/** One step of the pending branch manifest calculation. */
export interface PendingBranchManifestFactor {
  describe(): string;
  adjust(item: PendingBranchManifest, value: number): number;
}

export class MinimumPendingBranchManifestAdjuster implements PendingBranchManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBranchManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingBranchManifestAdjuster implements PendingBranchManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingBranchManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingBranchManifestAdjuster implements PendingBranchManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingBranchManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PendingBranchManifestDiscountOffsetAdjuster implements PendingBranchManifestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: PendingBranchManifest, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class FlaggedPendingBranchManifestAdjuster implements PendingBranchManifestFactor {
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

  adjust(item: PendingBranchManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending branch manifest steps in order and keeps a trace of each. */
export class PendingBranchManifestEngine {
  steps: PendingBranchManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBranchManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingBranchManifest): number {
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

  evaluateAll(items: PendingBranchManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingBranchManifestEngine(flagsValue: flags.Registry): PendingBranchManifestEngine {
  return new PendingBranchManifestEngine(
    [
      new MinimumPendingBranchManifestAdjuster(10.1),
      new PercentPendingBranchManifestAdjuster(12),
      new RoundingPendingBranchManifestAdjuster(0.05),
      new PendingBranchManifestDiscountOffsetAdjuster(0.09),
      new FlaggedPendingBranchManifestAdjuster(flagsValue, "pending-branch-manifest-rolling", -7.9),
    ],
    [],
    1,
    36031.9,
  );
}
