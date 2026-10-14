import * as flags from "../../../../kit/flags.js";
import { FlightGroup } from "./flight-group.js";

/** One step of the flight group calculation. */
export interface FlightGroupModifier {
  describe(): string;
  adjust(item: FlightGroup, value: number): number;
}

export class CapFlightGroupAdjuster implements FlightGroupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedFlightGroupAdjuster implements FlightGroupModifier {
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

  adjust(item: FlightGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleFlightGroupAdjuster implements FlightGroupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FlightGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlightGroupWeightOffsetAdjuster implements FlightGroupModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: FlightGroup, value: number): number {
    return value + item.weight * this.weight;
  }
}

/** Runs the flight group steps in order and keeps a trace of each. */
export class FlightGroupEngine {
  steps: FlightGroupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightGroupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FlightGroup): number {
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

  evaluateAll(items: FlightGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFlightGroupEngine(flagsValue: flags.Registry): FlightGroupEngine {
  return new FlightGroupEngine(
    [
      new CapFlightGroupAdjuster(26112),
      new FlaggedFlightGroupAdjuster(flagsValue, "flight-group-manual", -9.7),
      new LocaleFlightGroupAdjuster(
        new Map<string, number>([["south", 0.77], ["retail", 0.76], ["central", 1.31]]),
      ),
      new FlightGroupWeightOffsetAdjuster(0.72),
    ],
    [],
    2.8,
    31256.4,
  );
}
