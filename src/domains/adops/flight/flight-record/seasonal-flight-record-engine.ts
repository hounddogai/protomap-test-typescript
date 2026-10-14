import * as flags from "../../../../kit/flags.js";
import { SeasonalFlightRecord } from "./seasonal-flight-record.js";

/** One step of the seasonal flight record calculation. */
export interface SeasonalFlightRecordModifier {
  describe(): string;
  adjust(item: SeasonalFlightRecord, value: number): number;
}

export class LocaleSeasonalFlightRecordAdjuster implements SeasonalFlightRecordModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: SeasonalFlightRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSeasonalFlightRecordAdjuster implements SeasonalFlightRecordModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalFlightRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumSeasonalFlightRecordAdjuster implements SeasonalFlightRecordModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalFlightRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSeasonalFlightRecordAdjuster implements SeasonalFlightRecordModifier {
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

  adjust(item: SeasonalFlightRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalFlightRecordCapacityOffsetAdjuster implements SeasonalFlightRecordModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: SeasonalFlightRecord, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the seasonal flight record steps in order and keeps a trace of each. */
export class SeasonalFlightRecordEngine {
  steps: SeasonalFlightRecordModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalFlightRecordModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalFlightRecord): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: SeasonalFlightRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalFlightRecordEngine(flagsValue: flags.Registry): SeasonalFlightRecordEngine {
  return new SeasonalFlightRecordEngine(
    [
      new LocaleSeasonalFlightRecordAdjuster(
        new Map<string, number>([["retail", 1.01], ["central", 0.97], ["east", 0.76]]),
      ),
      new CapSeasonalFlightRecordAdjuster(45335),
      new MinimumSeasonalFlightRecordAdjuster(32.5),
      new FlaggedSeasonalFlightRecordAdjuster(flagsValue, "seasonal-flight-record-tiered", -2.5),
      new SeasonalFlightRecordCapacityOffsetAdjuster(0.54),
    ],
    [],
    3.2,
    59428.8,
  );
}
