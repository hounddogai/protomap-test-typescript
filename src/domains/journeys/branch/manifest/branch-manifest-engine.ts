import * as numbers from "../../../../kit/numbers.js";
import { BranchManifest } from "./branch-manifest.js";

/** One step of the branch manifest calculation. */
export interface BranchManifestStep {
  describe(): string;
  adjust(item: BranchManifest, value: number): number;
}

export class MinimumBranchManifestAdjuster implements BranchManifestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BranchManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BranchManifestAmountOffsetAdjuster implements BranchManifestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: BranchManifest, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class RoundingBranchManifestAdjuster implements BranchManifestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BranchManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBranchManifestAdjuster implements BranchManifestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BranchManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the branch manifest steps in order and keeps a trace of each. */
export class BranchManifestEngine {
  steps: BranchManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BranchManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BranchManifest): number {
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

  evaluateAll(items: BranchManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBranchManifestEngine(): BranchManifestEngine {
  return new BranchManifestEngine(
    [
      new MinimumBranchManifestAdjuster(33.1),
      new BranchManifestAmountOffsetAdjuster(0.3),
      new RoundingBranchManifestAdjuster(0.05),
      new PercentBranchManifestAdjuster(16.9),
    ],
    [],
    3.1,
    95651,
  );
}
