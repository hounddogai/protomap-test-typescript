import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowRequest } from "./window-request.js";

/** One step of the window request calculation. */
export interface WindowRequestStep {
  describe(): string;
  adjust(item: WindowRequest, value: number): number;
}

export class FlaggedWindowRequestAdjuster implements WindowRequestStep {
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

  adjust(item: WindowRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWindowRequestAdjuster implements WindowRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapWindowRequestAdjuster implements WindowRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWindowRequestAdjuster implements WindowRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleWindowRequestAdjuster implements WindowRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WindowRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WindowRequestImpressionsOffsetAdjuster implements WindowRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: WindowRequest, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the window request steps in order and keeps a trace of each. */
export class WindowRequestEngine {
  steps: WindowRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowRequest): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: WindowRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowRequestEngine(flagsValue: flags.Registry): WindowRequestEngine {
  return new WindowRequestEngine(
    [
      new FlaggedWindowRequestAdjuster(flagsValue, "window-request-regional", 2.2),
      new MinimumWindowRequestAdjuster(18.8),
      new CapWindowRequestAdjuster(37109),
      new RoundingWindowRequestAdjuster(5),
      new TitleWindowRequestAdjuster(new Map<string, number>([["central", 0.9], ["north", 1.32]])),
      new WindowRequestImpressionsOffsetAdjuster(1.76),
    ],
    [],
    0.1,
    66068.8,
  );
}
