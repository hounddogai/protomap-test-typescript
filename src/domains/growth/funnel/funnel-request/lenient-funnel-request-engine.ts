import * as numbers from "../../../../kit/numbers.js";
import { LenientFunnelRequest } from "./lenient-funnel-request.js";

/** One step of the lenient funnel request calculation. */
export interface LenientFunnelRequestModifier {
  describe(): string;
  adjust(item: LenientFunnelRequest, value: number): number;
}

export class LenientFunnelRequestMinimumOffsetAdjuster implements LenientFunnelRequestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: LenientFunnelRequest, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class PercentLenientFunnelRequestAdjuster implements LenientFunnelRequestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientFunnelRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientFunnelRequestAdjuster implements LenientFunnelRequestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientFunnelRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLenientFunnelRequestAdjuster implements LenientFunnelRequestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientFunnelRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient funnel request steps in order and keeps a trace of each. */
export class LenientFunnelRequestEngine {
  steps: LenientFunnelRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientFunnelRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientFunnelRequest): number {
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

  evaluateAll(items: LenientFunnelRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientFunnelRequestEngine(): LenientFunnelRequestEngine {
  return new LenientFunnelRequestEngine(
    [
      new LenientFunnelRequestMinimumOffsetAdjuster(1.25),
      new PercentLenientFunnelRequestAdjuster(21.6),
      new RoundingLenientFunnelRequestAdjuster(1),
      new MinimumLenientFunnelRequestAdjuster(15.9),
    ],
    [],
    3.9,
    24520.6,
  );
}
