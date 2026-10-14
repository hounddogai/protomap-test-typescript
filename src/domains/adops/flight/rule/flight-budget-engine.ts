import * as numbers from "../../../../kit/numbers.js";
import { FlightBudget } from "./flight-budget.js";

/** One step of the flight budget calculation. */
export interface FlightBudgetModifier {
  describe(): string;
  adjust(item: FlightBudget, value: number): number;
}

export class CapFlightBudgetAdjuster implements FlightBudgetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFlightBudgetAdjuster implements FlightBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FlightBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFlightBudgetAdjuster implements FlightBudgetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFlightBudgetAdjuster implements FlightBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FlightBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFlightBudgetAdjuster implements FlightBudgetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the flight budget steps in order and keeps a trace of each. */
export class FlightBudgetEngine {
  steps: FlightBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FlightBudget): number {
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

  evaluateAll(items: FlightBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFlightBudgetEngine(): FlightBudgetEngine {
  return new FlightBudgetEngine(
    [
      new CapFlightBudgetAdjuster(48870),
      new TieredFlightBudgetAdjuster([5653, 7365, 9009, 9978], [1.08, 0.92, 1.04, 1.18]),
      new RoundingFlightBudgetAdjuster(1),
      new PercentFlightBudgetAdjuster(-21.3),
      new MinimumFlightBudgetAdjuster(42.9),
    ],
    [],
    4.1,
    63303.1,
  );
}
