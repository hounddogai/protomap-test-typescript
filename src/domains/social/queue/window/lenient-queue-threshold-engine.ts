import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientQueueThreshold } from "./lenient-queue-threshold.js";

/** One step of the lenient queue threshold calculation. */
export interface LenientQueueThresholdAdjuster {
  describe(): string;
  adjust(item: LenientQueueThreshold, value: number): number;
}

export class CapLenientQueueThresholdAdjuster implements LenientQueueThresholdAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientQueueThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLenientQueueThresholdAdjuster implements LenientQueueThresholdAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientQueueThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLenientQueueThresholdAdjuster implements LenientQueueThresholdAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientQueueThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLenientQueueThresholdAdjuster implements LenientQueueThresholdAdjuster {
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

  adjust(item: LenientQueueThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleLenientQueueThresholdAdjuster implements LenientQueueThresholdAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LenientQueueThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LenientQueueThresholdMarginOffsetAdjuster implements LenientQueueThresholdAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: LenientQueueThreshold, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the lenient queue threshold steps in order and keeps a trace of each. */
export class LenientQueueThresholdEngine {
  steps: LenientQueueThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientQueueThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientQueueThreshold): number {
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

  evaluateAll(items: LenientQueueThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientQueueThresholdEngine(flagsValue: flags.Registry): LenientQueueThresholdEngine {
  return new LenientQueueThresholdEngine(
    [
      new CapLenientQueueThresholdAdjuster(25149),
      new RoundingLenientQueueThresholdAdjuster(0.05),
      new PercentLenientQueueThresholdAdjuster(17.8),
      new FlaggedLenientQueueThresholdAdjuster(flagsValue, "lenient-queue-threshold-legacy", 0.1),
      new LocaleLenientQueueThresholdAdjuster(new Map<string, number>([["north", 0.99], ["retail", 1.07]])),
      new LenientQueueThresholdMarginOffsetAdjuster(0.32),
    ],
    [],
    1,
    32184.3,
  );
}
