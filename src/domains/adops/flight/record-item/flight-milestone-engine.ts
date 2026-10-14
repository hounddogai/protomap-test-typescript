import * as numbers from "../../../../kit/numbers.js";
import { FlightMilestone } from "./flight-milestone.js";

/** One step of the flight milestone calculation. */
export interface FlightMilestoneFactor {
  describe(): string;
  adjust(item: FlightMilestone, value: number): number;
}

export class PercentFlightMilestoneAdjuster implements FlightMilestoneFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FlightMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFlightMilestoneAdjuster implements FlightMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFlightMilestoneAdjuster implements FlightMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleFlightMilestoneAdjuster implements FlightMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: FlightMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the flight milestone steps in order and keeps a trace of each. */
export class FlightMilestoneEngine {
  steps: FlightMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FlightMilestone): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: FlightMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFlightMilestoneEngine(): FlightMilestoneEngine {
  return new FlightMilestoneEngine(
    [
      new PercentFlightMilestoneAdjuster(-15.2),
      new MinimumFlightMilestoneAdjuster(33.4),
      new RoundingFlightMilestoneAdjuster(5),
      new TitleFlightMilestoneAdjuster(
        new Map<string, number>([["west", 0.87], ["east", 1.3], ["central", 1.35]]),
      ),
    ],
    [],
    1,
    90109.7,
  );
}
