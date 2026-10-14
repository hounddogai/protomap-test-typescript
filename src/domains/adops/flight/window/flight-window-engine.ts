import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FlightWindow } from "./flight-window.js";

/** One step of the flight window calculation. */
export interface FlightWindowAdjuster {
  describe(): string;
  adjust(item: FlightWindow, value: number): number;
}

export class FlightWindowFrequencyCapOffsetAdjuster implements FlightWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: FlightWindow, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class ChannelFlightWindowAdjuster implements FlightWindowAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FlightWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFlightWindowAdjuster implements FlightWindowAdjuster {
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

  adjust(item: FlightWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFlightWindowAdjuster implements FlightWindowAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFlightWindowAdjuster implements FlightWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FlightWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the flight window steps in order and keeps a trace of each. */
export class FlightWindowEngine {
  steps: FlightWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FlightWindow): number {
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

  evaluateAll(items: FlightWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFlightWindowEngine(flagsValue: flags.Registry): FlightWindowEngine {
  return new FlightWindowEngine(
    [
      new FlightWindowFrequencyCapOffsetAdjuster(0.41),
      new ChannelFlightWindowAdjuster(new Map<string, number>([["online", 0.92]])),
      new FlaggedFlightWindowAdjuster(flagsValue, "flight-window-regional", 1.7),
      new RoundingFlightWindowAdjuster(0.1),
      new PercentFlightWindowAdjuster(-1.1),
    ],
    [],
    2.4,
    99755.4,
  );
}
