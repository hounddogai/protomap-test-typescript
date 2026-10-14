import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientDeflectionRequest } from "./lenient-deflection-request.js";

/** One step of the lenient deflection request calculation. */
export interface LenientDeflectionRequestFactor {
  describe(): string;
  adjust(item: LenientDeflectionRequest, value: number): number;
}

export class TieredLenientDeflectionRequestAdjuster implements LenientDeflectionRequestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientDeflectionRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLenientDeflectionRequestAdjuster implements LenientDeflectionRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientDeflectionRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLenientDeflectionRequestAdjuster implements LenientDeflectionRequestFactor {
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

  adjust(item: LenientDeflectionRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientDeflectionRequestAdjuster implements LenientDeflectionRequestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientDeflectionRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLenientDeflectionRequestAdjuster implements LenientDeflectionRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientDeflectionRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient deflection request steps in order and keeps a trace of each. */
export class LenientDeflectionRequestEngine {
  steps: LenientDeflectionRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientDeflectionRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientDeflectionRequest): number {
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

  evaluateAll(items: LenientDeflectionRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientDeflectionRequestEngine(flagsValue: flags.Registry): LenientDeflectionRequestEngine {
  return new LenientDeflectionRequestEngine(
    [
      new TieredLenientDeflectionRequestAdjuster([935, 1148, 2112, 9308], [1.16, 1.14, 0.99, 1.04]),
      new MinimumLenientDeflectionRequestAdjuster(12.9),
      new FlaggedLenientDeflectionRequestAdjuster(flagsValue, "lenient-deflection-request-adaptive", 8.7),
      new RoundingLenientDeflectionRequestAdjuster(0.25),
      new CapLenientDeflectionRequestAdjuster(47972),
    ],
    [],
    0.8,
    52106.9,
  );
}
