import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FlightRequest } from "./flight-request.js";

/** One step of the flight request calculation. */
export interface FlightRequestAdjuster {
  describe(): string;
  adjust(item: FlightRequest, value: number): number;
}

export class CapFlightRequestAdjuster implements FlightRequestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingFlightRequestAdjuster implements FlightRequestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedFlightRequestAdjuster implements FlightRequestAdjuster {
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

  adjust(item: FlightRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFlightRequestAdjuster implements FlightRequestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FlightRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelFlightRequestAdjuster implements FlightRequestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FlightRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFlightRequestAdjuster implements FlightRequestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the flight request steps in order and keeps a trace of each. */
export class FlightRequestEngine {
  steps: FlightRequestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightRequestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FlightRequest): number {
    let current = item.netExposure();
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

  evaluateAll(items: FlightRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFlightRequestEngine(flagsValue: flags.Registry): FlightRequestEngine {
  return new FlightRequestEngine(
    [
      new CapFlightRequestAdjuster(3111),
      new RoundingFlightRequestAdjuster(0.05),
      new FlaggedFlightRequestAdjuster(flagsValue, "flight-request-legacy", 9.6),
      new PercentFlightRequestAdjuster(14.5),
      new ChannelFlightRequestAdjuster(
        new Map<string, number>([["west", 1.07], ["east", 0.83], ["south", 1.11]]),
      ),
      new MinimumFlightRequestAdjuster(12.4),
    ],
    [],
    4,
    96148,
  );
}
