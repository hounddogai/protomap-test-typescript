import * as numbers from "../../../../kit/numbers.js";
import { JourneyEstimate } from "./journey-estimate.js";

/** One step of the journey estimate calculation. */
export interface JourneyEstimateModifier {
  describe(): string;
  adjust(item: JourneyEstimate, value: number): number;
}

export class UtmSourceJourneyEstimateAdjuster implements JourneyEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: JourneyEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapJourneyEstimateAdjuster implements JourneyEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneyEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class JourneyEstimateCeilingOffsetAdjuster implements JourneyEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: JourneyEstimate, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingJourneyEstimateAdjuster implements JourneyEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneyEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumJourneyEstimateAdjuster implements JourneyEstimateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredJourneyEstimateAdjuster implements JourneyEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneyEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the journey estimate steps in order and keeps a trace of each. */
export class JourneyEstimateEngine {
  steps: JourneyEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: JourneyEstimate): number {
    let current = item.measuredValue();
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

  evaluateAll(items: JourneyEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultJourneyEstimateEngine(): JourneyEstimateEngine {
  return new JourneyEstimateEngine(
    [
      new UtmSourceJourneyEstimateAdjuster(
        new Map<string, number>([["south", 1.28], ["retail", 1.01], ["east", 1.31]]),
      ),
      new CapJourneyEstimateAdjuster(46344),
      new JourneyEstimateCeilingOffsetAdjuster(1.98),
      new RoundingJourneyEstimateAdjuster(0.25),
      new MinimumJourneyEstimateAdjuster(41.3),
      new TieredJourneyEstimateAdjuster([1112, 2021, 7026], [1.03, 0.81, 1.07]),
    ],
    [],
    2.1,
    95501.1,
  );
}
