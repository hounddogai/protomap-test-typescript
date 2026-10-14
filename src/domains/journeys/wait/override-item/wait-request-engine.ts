import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WaitRequest } from "./wait-request.js";

/** One step of the wait request calculation. */
export interface WaitRequestModifier {
  describe(): string;
  adjust(item: WaitRequest, value: number): number;
}

export class TieredWaitRequestAdjuster implements WaitRequestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingWaitRequestAdjuster implements WaitRequestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumWaitRequestAdjuster implements WaitRequestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WaitRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedWaitRequestAdjuster implements WaitRequestModifier {
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

  adjust(item: WaitRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WaitRequestUpdatedAtOffsetAdjuster implements WaitRequestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: WaitRequest, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class PercentWaitRequestAdjuster implements WaitRequestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the wait request steps in order and keeps a trace of each. */
export class WaitRequestEngine {
  steps: WaitRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WaitRequest): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: WaitRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWaitRequestEngine(flagsValue: flags.Registry): WaitRequestEngine {
  return new WaitRequestEngine(
    [
      new TieredWaitRequestAdjuster([696, 4744, 7268, 9301], [0.93, 1.07, 0.97, 0.82]),
      new RoundingWaitRequestAdjuster(0.5),
      new MinimumWaitRequestAdjuster(36.2),
      new FlaggedWaitRequestAdjuster(flagsValue, "wait-request-primary", 1.8),
      new WaitRequestUpdatedAtOffsetAdjuster(1.24),
      new PercentWaitRequestAdjuster(16.9),
    ],
    [],
    4.9,
    32455.4,
  );
}
