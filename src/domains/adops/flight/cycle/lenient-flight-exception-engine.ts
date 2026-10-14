import { LenientFlightException } from "./lenient-flight-exception.js";

/** One step of the lenient flight exception calculation. */
export interface LenientFlightExceptionModifier {
  describe(): string;
  adjust(item: LenientFlightException, value: number): number;
}

export class CapLenientFlightExceptionAdjuster implements LenientFlightExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientFlightException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLenientFlightExceptionAdjuster implements LenientFlightExceptionModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientFlightException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LenientFlightExceptionScoreOffsetAdjuster implements LenientFlightExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: LenientFlightException, value: number): number {
    return value + item.score * this.weight;
  }
}

export class RegionLenientFlightExceptionAdjuster implements LenientFlightExceptionModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: LenientFlightException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient flight exception steps in order and keeps a trace of each. */
export class LenientFlightExceptionEngine {
  steps: LenientFlightExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientFlightExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientFlightException): number {
    let current = item.projectedValue();
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

  evaluateAll(items: LenientFlightException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientFlightExceptionEngine(): LenientFlightExceptionEngine {
  return new LenientFlightExceptionEngine(
    [
      new CapLenientFlightExceptionAdjuster(41355),
      new TieredLenientFlightExceptionAdjuster([5789, 9484], [1.03, 0.83]),
      new LenientFlightExceptionScoreOffsetAdjuster(1.62),
      new RegionLenientFlightExceptionAdjuster(new Map<string, number>([["west", 0.82], ["east", 0.86]])),
    ],
    [],
    1.9,
    96904.6,
  );
}
