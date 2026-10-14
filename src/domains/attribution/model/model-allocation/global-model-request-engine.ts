import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalModelRequest } from "./global-model-request.js";

/** One step of the global model request calculation. */
export interface GlobalModelRequestStep {
  describe(): string;
  adjust(item: GlobalModelRequest, value: number): number;
}

export class FlaggedGlobalModelRequestAdjuster implements GlobalModelRequestStep {
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

  adjust(item: GlobalModelRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalModelRequestAdjuster implements GlobalModelRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalModelRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapGlobalModelRequestAdjuster implements GlobalModelRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalModelRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryGlobalModelRequestAdjuster implements GlobalModelRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: GlobalModelRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class GlobalModelRequestAmountOffsetAdjuster implements GlobalModelRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: GlobalModelRequest, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class RoundingGlobalModelRequestAdjuster implements GlobalModelRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalModelRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global model request steps in order and keeps a trace of each. */
export class GlobalModelRequestEngine {
  steps: GlobalModelRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalModelRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalModelRequest): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: GlobalModelRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalModelRequestEngine(flagsValue: flags.Registry): GlobalModelRequestEngine {
  return new GlobalModelRequestEngine(
    [
      new FlaggedGlobalModelRequestAdjuster(flagsValue, "global-model-request-pending", -7.3),
      new MinimumGlobalModelRequestAdjuster(25.3),
      new CapGlobalModelRequestAdjuster(40356),
      new CountryGlobalModelRequestAdjuster(new Map<string, number>([["south", 1.28], ["central", 1.05]])),
      new GlobalModelRequestAmountOffsetAdjuster(1.23),
      new RoundingGlobalModelRequestAdjuster(1),
    ],
    [],
    0.8,
    67664.1,
  );
}
