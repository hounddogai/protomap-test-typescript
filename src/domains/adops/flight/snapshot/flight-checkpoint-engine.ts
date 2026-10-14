import * as numbers from "../../../../kit/numbers.js";
import { FlightCheckpoint } from "./flight-checkpoint.js";

/** One step of the flight checkpoint calculation. */
export interface FlightCheckpointStep {
  describe(): string;
  adjust(item: FlightCheckpoint, value: number): number;
}

export class RoundingFlightCheckpointAdjuster implements FlightCheckpointStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlightCheckpointPriorityOffsetAdjuster implements FlightCheckpointStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: FlightCheckpoint, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class MinimumFlightCheckpointAdjuster implements FlightCheckpointStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFlightCheckpointAdjuster implements FlightCheckpointStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FlightCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelFlightCheckpointAdjuster implements FlightCheckpointStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FlightCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the flight checkpoint steps in order and keeps a trace of each. */
export class FlightCheckpointEngine {
  steps: FlightCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FlightCheckpoint): number {
    let current = item.measuredValue();
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

  evaluateAll(items: FlightCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFlightCheckpointEngine(): FlightCheckpointEngine {
  return new FlightCheckpointEngine(
    [
      new RoundingFlightCheckpointAdjuster(0.5),
      new FlightCheckpointPriorityOffsetAdjuster(0.56),
      new MinimumFlightCheckpointAdjuster(23.1),
      new PercentFlightCheckpointAdjuster(-21.9),
      new ChannelFlightCheckpointAdjuster(new Map<string, number>([["online", 1.28], ["retail", 1.18]])),
    ],
    [],
    2.5,
    92225.8,
  );
}
