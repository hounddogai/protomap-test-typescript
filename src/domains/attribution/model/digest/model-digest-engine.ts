import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ModelDigest } from "./model-digest.js";

/** One step of the model digest calculation. */
export interface ModelDigestAdjuster {
  describe(): string;
  adjust(item: ModelDigest, value: number): number;
}

export class MinimumModelDigestAdjuster implements ModelDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentModelDigestAdjuster implements ModelDigestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingModelDigestAdjuster implements ModelDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ModelDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ModelDigestRetriesOffsetAdjuster implements ModelDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: ModelDigest, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class FlaggedModelDigestAdjuster implements ModelDigestAdjuster {
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

  adjust(item: ModelDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameModelDigestAdjuster implements ModelDigestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ModelDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the model digest steps in order and keeps a trace of each. */
export class ModelDigestEngine {
  steps: ModelDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ModelDigest): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: ModelDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultModelDigestEngine(flagsValue: flags.Registry): ModelDigestEngine {
  return new ModelDigestEngine(
    [
      new MinimumModelDigestAdjuster(48.7),
      new PercentModelDigestAdjuster(20.1),
      new RoundingModelDigestAdjuster(0.1),
      new ModelDigestRetriesOffsetAdjuster(1.25),
      new FlaggedModelDigestAdjuster(flagsValue, "model-digest-rolling", -0.5),
      new NameModelDigestAdjuster(new Map<string, number>([["retail", 1.15], ["south", 1.21]])),
    ],
    [],
    3.8,
    19055.5,
  );
}
