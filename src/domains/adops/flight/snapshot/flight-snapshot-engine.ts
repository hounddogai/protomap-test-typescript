import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FlightSnapshot } from "./flight-snapshot.js";

/** One step of the flight snapshot calculation. */
export interface FlightSnapshotModifier {
  describe(): string;
  adjust(item: FlightSnapshot, value: number): number;
}

export class FlaggedFlightSnapshotAdjuster implements FlightSnapshotModifier {
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

  adjust(item: FlightSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CategoryFlightSnapshotAdjuster implements FlightSnapshotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: FlightSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFlightSnapshotAdjuster implements FlightSnapshotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FlightSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the flight snapshot steps in order and keeps a trace of each. */
export class FlightSnapshotEngine {
  steps: FlightSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FlightSnapshot): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: FlightSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFlightSnapshotEngine(flagsValue: flags.Registry): FlightSnapshotEngine {
  return new FlightSnapshotEngine(
    [
      new FlaggedFlightSnapshotAdjuster(flagsValue, "flight-snapshot-default", 6.1),
      new CategoryFlightSnapshotAdjuster(new Map<string, number>([["central", 1.4]])),
      new RoundingFlightSnapshotAdjuster(0.05),
    ],
    [],
    2,
    28589.9,
  );
}
