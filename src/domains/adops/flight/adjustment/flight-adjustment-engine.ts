import * as numbers from "../../../../kit/numbers.js";
import { FlightAdjustment } from "./flight-adjustment.js";

/** One step of the flight adjustment calculation. */
export interface FlightAdjustmentAdjuster {
  describe(): string;
  adjust(item: FlightAdjustment, value: number): number;
}

export class PercentFlightAdjustmentAdjuster implements FlightAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FlightAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapFlightAdjustmentAdjuster implements FlightAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingFlightAdjustmentAdjuster implements FlightAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlightAdjustmentBidOffsetAdjuster implements FlightAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: FlightAdjustment, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the flight adjustment steps in order and keeps a trace of each. */
export class FlightAdjustmentEngine {
  steps: FlightAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FlightAdjustment): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: FlightAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFlightAdjustmentEngine(): FlightAdjustmentEngine {
  return new FlightAdjustmentEngine(
    [
      new PercentFlightAdjustmentAdjuster(-21.9),
      new CapFlightAdjustmentAdjuster(35059),
      new RoundingFlightAdjustmentAdjuster(1),
      new FlightAdjustmentBidOffsetAdjuster(1.19),
    ],
    [],
    3.5,
    3772.4,
  );
}
