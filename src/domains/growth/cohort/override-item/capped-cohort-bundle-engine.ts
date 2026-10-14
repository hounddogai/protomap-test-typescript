import * as numbers from "../../../../kit/numbers.js";
import { CappedCohortBundle } from "./capped-cohort-bundle.js";

/** One step of the capped cohort bundle calculation. */
export interface CappedCohortBundleModifier {
  describe(): string;
  adjust(item: CappedCohortBundle, value: number): number;
}

export class CapCappedCohortBundleAdjuster implements CappedCohortBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedCohortBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedCohortBundleAdjuster implements CappedCohortBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedCohortBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCappedCohortBundleAdjuster implements CappedCohortBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedCohortBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CappedCohortBundleSendAtOffsetAdjuster implements CappedCohortBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: CappedCohortBundle, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class NameCappedCohortBundleAdjuster implements CappedCohortBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CappedCohortBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCappedCohortBundleAdjuster implements CappedCohortBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedCohortBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped cohort bundle steps in order and keeps a trace of each. */
export class CappedCohortBundleEngine {
  steps: CappedCohortBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedCohortBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedCohortBundle): number {
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

  evaluateAll(items: CappedCohortBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedCohortBundleEngine(): CappedCohortBundleEngine {
  return new CappedCohortBundleEngine(
    [
      new CapCappedCohortBundleAdjuster(21070),
      new RoundingCappedCohortBundleAdjuster(0.5),
      new MinimumCappedCohortBundleAdjuster(0),
      new CappedCohortBundleSendAtOffsetAdjuster(0.25),
      new NameCappedCohortBundleAdjuster(
        new Map<string, number>([["online", 1.16], ["west", 1.11], ["central", 0.94]]),
      ),
      new PercentCappedCohortBundleAdjuster(1),
    ],
    [],
    1.4,
    26780.6,
  );
}
